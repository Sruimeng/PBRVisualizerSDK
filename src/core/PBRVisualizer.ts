import * as THREE from 'three';
import { EventEmitter } from 'events';
import { 
  VisualizerOptions, 
  SceneState, 
  ModelState, 
  BatchUpdate, 
  BatchOptions, 
  TransitionOptions,
  PerformanceStats,
  StateChangeEvent,
  ModelLoadedEvent,
  ErrorEvent,
  ShareState
} from '../types/core';
import { StateMachine } from './StateMachine';
import { Renderer } from './Renderer';
import { ModelManager } from './ModelManager';
import { EnvironmentSystem } from './EnvironmentSystem';
import { QualityDetector } from './QualityDetector';

export class PBRVisualizer extends EventEmitter {
  private container: HTMLElement;
  private renderer: Renderer;
  private stateMachine: StateMachine;
  private modelManager: ModelManager;
  private environmentSystem: EnvironmentSystem;
  private qualityDetector: QualityDetector;
  private isDisposed = false;
  private performanceMonitor: number | null = null;
  private stats: PerformanceStats;

  constructor(options: VisualizerOptions) {
    super();
    
    this.container = options.container;
    this.validateContainer();

    // 初始化性能统计
    this.stats = this.createInitialStats();

    // 初始化质量检测器
    this.qualityDetector = new QualityDetector();
    const quality = this.qualityDetector.detectQuality();

    // 合并质量配置
    const finalQuality = { ...quality, ...options.quality };

    // 初始化状态机
    const initialState = this.createInitialState(options);
    this.stateMachine = new StateMachine(initialState);

    // 初始化环境系统
    this.environmentSystem = new EnvironmentSystem(finalQuality);

    // 初始化模型管理器
    this.modelManager = new ModelManager(finalQuality);

    // 初始化渲染器
    this.renderer = new Renderer({
      container: this.container,
      quality: finalQuality,
      debug: options.debug || false
    });

    // 初始化模型
    this.initializeModels(options.models);

    // 自动调整大小
    if (options.autoResize !== false) {
      this.setupAutoResize();
    }

    // 启动性能监控
    this.startPerformanceMonitoring();

    // 绑定事件
    this.bindEvents();
  }

  async updateModel(modelId: string, state: Partial<ModelState>, options: TransitionOptions = { duration: 0 }): Promise<void> {
    try {
      this.stateMachine.updateModelState(modelId, state);
      
      // 应用状态到渲染器
      await this.renderer.updateModel(modelId, state, options);

      // 触发状态变更事件
      const event: StateChangeEvent = {
        stateId: modelId,
        updatedModels: [modelId],
        timestamp: Date.now()
      };
      this.emit('stateChange', event);

    } catch (error) {
      this.handleError('state', `Failed to update model ${modelId}: ${error}`);
      throw error;
    }
  }

  async batchUpdate(updates: BatchUpdate[], options: BatchOptions): Promise<void> {
    try {
      await this.stateMachine.batchUpdate(updates, options);
      
      // 批量应用到渲染器
      await this.renderer.batchUpdate(updates, options);

      // 触发批量状态变更事件
      const event: StateChangeEvent = {
        stateId: 'batch',
        updatedModels: updates.map(u => u.modelId),
        timestamp: Date.now()
      };
      this.emit('stateChange', event);

    } catch (error) {
      this.handleError('state', `Batch update failed: ${error}`);
      throw error;
    }
  }

  setCamera(position: [number, number, number], target: [number, number, number]): void {
    try {
      const cameraState = {
        position: new THREE.Vector3(...position),
        target: new THREE.Vector3(...target)
      };

      this.stateMachine.updateModelState('camera', { transform: { position: cameraState.position } } as any);
      this.renderer.updateCamera(cameraState.position, cameraState.target);

    } catch (error) {
      this.handleError('state', `Failed to set camera: ${error}`);
      throw error;
    }
  }

  updateEnvironment(config: SceneState['global']['environment']): void {
    try {
      const currentState = this.stateMachine.getCurrentState();
      if (currentState) {
        currentState.global.environment = config;
        this.environmentSystem.updateEnvironment(config);
        this.renderer.updateEnvironment(config);
      }
    } catch (error) {
      this.handleError('render', `Failed to update environment: ${error}`);
      throw error;
    }
  }

  undo(): void {
    const success = this.stateMachine.undo();
    if (success) {
      const currentState = this.stateMachine.getCurrentState();
      if (currentState) {
        this.renderer.applyState(currentState);
      }
    }
  }

  redo(): void {
    const success = this.stateMachine.redo();
    if (success) {
      const currentState = this.stateMachine.getCurrentState();
      if (currentState) {
        this.renderer.applyState(currentState);
      }
    }
  }

  async shareState(): Promise<string> {
    try {
      const serialized = this.stateMachine.serialize();
      const state: ShareState = {
        version: '1.0',
        state: JSON.parse(serialized).state,
        timestamp: Date.now(),
        checksum: this.generateChecksum(serialized)
      };

      // 这里可以实现URL缩短服务
      const shareUrl = `${window.location.origin}/share/${btoa(JSON.stringify(state))}`;
      return shareUrl;

    } catch (error) {
      this.handleError('state', `Failed to share state: ${error}`);
      throw error;
    }
  }

  applyRawState(state: SceneState): void {
    try {
      this.stateMachine.registerState('raw', state);
      this.stateMachine.applyState('raw');
      this.renderer.applyState(state);
    } catch (error) {
      this.handleError('state', `Failed to apply raw state: ${error}`);
      throw error;
    }
  }

  setQuality(quality: Partial<SceneState['global']>): void {
    try {
      this.renderer.setQuality(quality);
      this.qualityDetector.setCustomQuality(quality);
    } catch (error) {
      this.handleError('render', `Failed to set quality: ${error}`);
      throw error;
    }
  }

  captureFrame(): string {
    return this.renderer.captureFrame();
  }

  getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;

    if (this.performanceMonitor) {
      cancelAnimationFrame(this.performanceMonitor);
      this.performanceMonitor = null;
    }

    this.renderer.dispose();
    this.modelManager.dispose();
    this.environmentSystem.dispose();
    this.stateMachine.clearHistory();

    this.removeAllListeners();
  }

  private validateContainer(): void {
    if (!this.container) {
      throw new Error('Container element is required');
    }
    if (!(this.container instanceof HTMLElement)) {
      throw new Error('Container must be an HTMLElement');
    }
  }

  private createInitialState(options: VisualizerOptions): SceneState {
    const defaultState: SceneState = {
      global: {
        environment: {
          type: 'noise-sphere',
          sphere: { radius: 0.8, pulse: false }
        },
        camera: {
          position: new THREE.Vector3(3, 2, 5),
          target: new THREE.Vector3(0, 0.5, 0),
          fov: 45,
          near: 0.1,
          far: 1000,
          controls: {
            enabled: true,
            autoRotate: false,
            autoRotateSpeed: 1.0
          }
        },
        postProcessing: {
          enabled: true,
          toneMapping: {
            type: 'aces',
            exposure: 1.0,
            whitePoint: 1.0
          },
          bloom: {
            enabled: true,
            strength: 0.5,
            radius: 0.4,
            threshold: 0.8
          },
          antialiasing: {
            type: 'fxaa',
            enabled: true
          }
        },
        sceneSettings: {
          exposure: 1.0,
          gamma: 2.2,
          toneMapping: THREE.ACESFilmicToneMapping
        }
      },
      models: {}
    };

    // 合并初始全局状态
    if (options.initialGlobalState) {
      Object.assign(defaultState.global, options.initialGlobalState);
    }

    return defaultState;
  }

  private async initializeModels(models: VisualizerOptions['models']): Promise<void> {
    for (const model of models) {
      try {
        await this.modelManager.loadModel(model.id, model.source);
        
        if (model.initialState) {
          await this.updateModel(model.id, model.initialState);
        }

        const event: ModelLoadedEvent = {
          modelId: model.id,
          loadTime: Date.now(),
          triangleCount: this.modelManager.getTriangleCount(model.id)
        };
        this.emit('modelLoaded', event);

      } catch (error) {
        this.handleError('load', `Failed to load model ${model.id}: ${error}`);
      }
    }
  }

  private setupAutoResize(): void {
    const resizeObserver = new ResizeObserver(() => {
      this.renderer.handleResize();
    });
    resizeObserver.observe(this.container);
  }

  private startPerformanceMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    const monitor = () => {
      if (this.isDisposed) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      frameCount++;
      
      if (deltaTime >= 1000) {
        this.stats.fps = Math.round((frameCount * 1000) / deltaTime);
        this.stats.frameTime = deltaTime / frameCount;
        
        // 获取渲染统计
        const renderStats = this.renderer.getStats();
        this.stats.drawCalls = renderStats.drawCalls;
        this.stats.triangles = renderStats.triangles;
        this.stats.memoryUsage = renderStats.memoryUsage;
        this.stats.gpuMemory = renderStats.gpuMemory;

        // 性能事件
        this.emit('performanceUpdate', this.stats);

        frameCount = 0;
        lastTime = currentTime;
      }

      this.performanceMonitor = requestAnimationFrame(monitor);
    };

    this.performanceMonitor = requestAnimationFrame(monitor);
  }

  private bindEvents(): void {
    this.on('performanceUpdate', (stats: PerformanceStats) => {
      if (stats.fps < 30) {
        this.setQuality({ postProcessing: { enabled: false } } as any);
      }
    });
  }

  private handleError(type: ErrorEvent['type'], message: string): void {
    const error: ErrorEvent = {
      type,
      message,
      recoverable: true,
      stack: new Error().stack
    };
    this.emit('error', error);
  }

  private createInitialStats(): PerformanceStats {
    return {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
      gpuMemory: 0
    };
  }

  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }
}