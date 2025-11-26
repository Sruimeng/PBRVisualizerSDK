import {
  PBRVisualizer,
  createModelVignette,
  updateVignetteCenter,
} from '@sruim/pbr-visualizer-sdk';
import * as THREE from 'three';
import { Box3, Color, Vector3 } from 'three';

// 全局类型声明
declare global {
  interface Window {
    resetAllViews: () => void;
    toggleAutoRotateAll: () => void;
    syncViews: () => void;
    focusLeft: () => void;
    focusRight: () => void;
  }
}

/**
 * 多模型控制器（DOM覆盖层方案）
 * 基于分屏Demo的优雅实现
 */
interface ViewportController {
  id: string;
  modelId: string;
  model: THREE.Object3D;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: any; // OrbitControls
  vignette?: THREE.Mesh;
  element: HTMLElement; // DOM覆盖元素
  isActive: boolean;
  position: Vector3;
}

/**
 * 基于DOM覆盖层的多模型系统
 * 实现优雅的热区独立控制
 */
export class MultiModelDOMOverlay {
  private visualizer: PBRVisualizer | null = null;
  private viewports = new Map<string, ViewportController>();
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number | null = null;
  private vignetteEnabled = true;

  // 模型配置
  private readonly modelConfigs = [
    {
      id: 'left_model',
      modelId: 'camera_model',
      elementId: 'viewL',
      position: new Vector3(-2.5, 0, 0),
    },
    {
      id: 'right_model',
      modelId: 'test_model',
      elementId: 'viewR',
      position: new Vector3(2.5, 0, 0),
    },
  ];

  constructor() {
    this.init();
  }

  /**
   * 初始化
   */
  private async init(): Promise<void> {
    try {
      // 创建DOM覆盖层结构
      this.createDOMStructure();

      // 初始化PBR Visualizer
      await this.initializePBRVisualizer();

      // 创建视口控制器
      await this.createViewportControllers();

      // 设置交互
      this.setupInteraction();

      // 开始渲染循环
      this.startRenderLoop();

      // 设置全局函数
      this.setupGlobalFunctions();

      console.log('[MultiModelDOMOverlay] Initialized successfully');
    } catch (error) {
      console.error('[MultiModelDOMOverlay] Initialization failed:', error);
      this.showError(error);
    }
  }

  /**
   * 创建DOM结构
   */
  private createDOMStructure(): void {
    const app = document.getElementById('app');
    if (!app) return;

    // 清空现有内容
    app.innerHTML = '';

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
            body {
                margin: 0;
                overflow: hidden;
                background: #0a0a0a;
                user-select: none;
            }
            #app {
                width: 100vw;
                height: 100vh;
                position: relative;
            }
            .viewport-overlay {
                position: absolute;
                top: 0;
                height: 100%;
                width: 50%;
                z-index: 10;
                touch-action: none;
                outline: none;
                cursor: grab;
            }
            .viewport-overlay:active {
                cursor: grabbing;
            }
            #viewL {
                left: 0;
                border-right: 1px solid #333;
                box-sizing: border-box;
            }
            #viewR {
                left: 50%;
            }
            canvas {
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 0;
            }
            .controls {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(20, 20, 20, 0.9);
                padding: 15px;
                border-radius: 8px;
                display: flex;
                gap: 10px;
                z-index: 20;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            button {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #fff;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
            }
            button:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            button.active {
                background: #4caf50;
                border-color: #4caf50;
                color: #000;
            }
            .viewport-label {
                position: absolute;
                top: 20px;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.8);
                background: rgba(20, 20, 20, 0.8);
                padding: 8px 12px;
                border-radius: 4px;
                pointer-events: none;
                z-index: 15;
            }
            #labelL {
                left: 20px;
            }
            #labelR {
                right: 20px;
            }
            .loading {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(20, 20, 20, 0.9);
                padding: 20px;
                border-radius: 8px;
                z-index: 100;
            }
        `;
    document.head.appendChild(style);

    // 创建视口覆盖层
    const leftView = document.createElement('div');
    leftView.id = 'viewL';
    leftView.className = 'viewport-overlay';
    app.appendChild(leftView);

    const rightView = document.createElement('div');
    rightView.id = 'viewR';
    rightView.className = 'viewport-overlay';
    app.appendChild(rightView);

    // 创建标签
    const leftLabel = document.createElement('div');
    leftLabel.id = 'labelL';
    leftLabel.className = 'viewport-label';
    leftLabel.textContent = '相机模型';
    app.appendChild(leftLabel);

    const rightLabel = document.createElement('div');
    rightLabel.id = 'labelR';
    rightLabel.className = 'viewport-label';
    rightLabel.textContent = '测试模型';
    app.appendChild(rightLabel);

    // 创建控制面板
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
            <button onclick="resetAllViews()">重置所有视图</button>
            <button onclick="toggleAutoRotateAll()">自动旋转</button>
            <button onclick="syncViews()">同步视角</button>
            <button onclick="focusLeft()">聚焦左侧</button>
            <button onclick="focusRight()">聚焦右侧</button>
        `;
    app.appendChild(controls);

    // 加载提示
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.id = 'loading';
    loading.textContent = '正在加载多模型演示...';
    app.appendChild(loading);
  }

  /**
   * 初始化PBR Visualizer
   */
  private async initializePBRVisualizer(): Promise<void> {
    this.visualizer = new PBRVisualizer({
      container: document.getElementById('app')!,
      models: [
        {
          id: 'camera_model',
          source: '../glb/Camera_XHS_17479384306051040g00831hpgdts3jo6g5pmo3n0nc99qji23br8.glb',
          initialState: {
            transform: {
              position: new Vector3(-2.5, 0, 0),
              rotation: new Euler(),
              scale: new Vector3(),
            },
          },
        },
        {
          id: 'test_model',
          source: '../glb/test.glb',
          initialState: {
            transform: {
              position: new Vector3(2.5, 0, 0),
              rotation: new Euler(),
              scale: new Vector3(),
            },
          },
        },
      ],
      initialGlobalState: {
        environment: {
          intensity: 1.2,
          url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
        },
        sceneSettings: {
          background: new Color(0x0a0a0a),
          exposure: 1.2,
        },
        camera: {
          position: new Vector3(0, 2, 8),
          target: new Vector3(0, 0, 0),
          fov: 45,
          controls: {
            enabled: false,
            autoRotate: false,
            autoRotateSpeed: 0,
          },
        },
        postProcessing: {
          enabled: true,
          toneMapping: {
            type: 5,
            exposure: 1.2,
            whitePoint: 0,
          },
          bloom: {
            enabled: false,
            strength: 0,
            radius: 0,
            threshold: 0,
          },
          ssao: {
            enabled: true,
            kernelRadius: 3,
            minDistance: 0,
            maxDistance: 0,
          },
          antialiasing: {
            enabled: true,
            type: 'fxaa' as const,
          },
        },
      },
    });

    await this.visualizer.initialize();

    // 获取渲染器
    this.renderer = (this.visualizer as any).renderer;
  }

  /**
   * 创建视口控制器
   */
  private async createViewportControllers(): Promise<void> {
    if (!this.visualizer) return;

    // 获取Three.js依赖
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const scene = (this.visualizer as any).scene;

    for (const config of this.modelConfigs) {
      const model = this.visualizer.getModel(config.modelId);
      if (!model) continue;

      // 创建独立的场景
      const viewportScene = new THREE.Scene();
      viewportScene.background = scene.background;
      viewportScene.environment = scene.environment;
      viewportScene.add(model);

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / 2 / window.innerHeight,
        0.1,
        1000,
      );
      camera.position.copy(config.position).add(new Vector3(0, 2, 5));
      camera.lookAt(config.position);

      // 获取DOM元素
      const element = document.getElementById(config.elementId);
      if (!element) continue;

      // 创建独立的控制器
      const controls = new OrbitControls(camera, element);
      controls.target.copy(config.position);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = true;

      // 创建暗角（可选）
      const boundingBox = new Box3().setFromObject(model);
      const vignette = createModelVignette(boundingBox, camera, {
        uRadius: 0.6,
        uSoftness: 0.4,
        uStrength: 0.8,
        uColor: new Color(0x000000),
      });
      viewportScene.add(vignette);

      // 创建控制器
      const controller: ViewportController = {
        id: config.id,
        modelId: config.modelId,
        model,
        scene: viewportScene,
        camera,
        controls,
        vignette,
        element,
        isActive: true,
        position: config.position,
      };

      this.viewports.set(config.id, controller);
    }
  }

  /**
   * 开始渲染循环
   */
  private startRenderLoop(): void {
    if (!this.renderer) return;

    // 隐藏加载提示
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // 更新所有控制器（关键：保持惯性）
      for (const controller of this.viewports.values()) {
        controller.controls.update();

        // 更新暗角中心
        if (controller.vignette && this.vignetteEnabled) {
          const center = new Vector3();
          new Box3().setFromObject(controller.model).getCenter(center);
          updateVignetteCenter(
            controller.vignette,
            center,
            controller.camera,
            window.innerWidth / 2,
            window.innerHeight,
          );
        }
      }

      // 分屏渲染
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setScissorTest(true);

      // 左侧渲染
      const leftController = this.viewports.get('left_model');
      if (leftController) {
        this.renderer.setViewport(0, 0, w / 2, h);
        this.renderer.setScissor(0, 0, w / 2, h);
        this.renderer.render(leftController.scene, leftController.camera);
      }

      // 右侧渲染
      const rightController = this.viewports.get('right_model');
      if (rightController) {
        this.renderer.setViewport(w / 2, 0, w / 2, h);
        this.renderer.setScissor(w / 2, 0, w / 2, h);
        this.renderer.render(rightController.scene, rightController.camera);
      }

      this.renderer.setScissorTest(false);
    };

    animate();
  }

  /**
   * 重置所有视图
   */
  public resetAllViews(): void {
    for (const controller of this.viewports.values()) {
      controller.camera.position.copy(controller.position.clone().add(new Vector3(0, 2, 5)));
      controller.controls.target.copy(controller.position);
      controller.controls.update();
    }
  }

  /**
   * 切换自动旋转
   */
  public toggleAutoRotateAll(): void {
    for (const controller of this.viewports.values()) {
      controller.controls.autoRotate = !controller.controls.autoRotate;
    }
  }

  /**
   * 同步视角
   */
  public syncViews(): void {
    const referenceController = this.viewports.get('left_model');
    if (!referenceController) return;

    const targetPos = referenceController.controls.target.clone();
    const camPos = referenceController.camera.position.clone();

    for (const controller of this.viewports.values()) {
      if (controller.id === 'left_model') continue;

      // 平滑过渡
      const duration = 500;
      const startPos = controller.camera.position.clone();
      const startTarget = controller.controls.target.clone();
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        controller.camera.position.lerpVectors(startPos, camPos, eased);
        controller.controls.target.lerpVectors(startTarget, targetPos, eased);
        controller.controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }

  /**
   * 聚焦左侧
   */
  public focusLeft(): void {
    const controller = this.viewports.get('left_model');
    if (controller) {
      controller.controls.target.copy(controller.position);
      controller.controls.update();
    }
  }

  /**
   * 聚焦右侧
   */
  public focusRight(): void {
    const controller = this.viewports.get('right_model');
    if (controller) {
      controller.controls.target.copy(controller.position);
      controller.controls.update();
    }
  }

  /**
   * 设置交互
   */
  private setupInteraction(): void {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (const controller of this.viewports.values()) {
        controller.camera.aspect = w / 2 / h;
        controller.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(w, h);
      }
    });
  }

  /**
   * 设置全局函数
   */
  private setupGlobalFunctions(): void {
    window.resetAllViews = () => this.resetAllViews();
    window.toggleAutoRotateAll = () => this.toggleAutoRotateAll();
    window.syncViews = () => this.syncViews();
    window.focusLeft = () => this.focusLeft();
    window.focusRight = () => this.focusRight();
  }

  /**
   * 显示错误
   */
  private showError(error: any): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
                <h3>初始化失败</h3>
                <p>${error.message || error}</p>
                <button onclick="location.reload()">重新加载</button>
            `;
      loading.style.display = 'block';
    }
  }

  /**
   * 销毁
   */
  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    for (const controller of this.viewports.values()) {
      controller.controls.dispose();
    }

    this.viewports.clear();
    this.renderer = null;
    this.visualizer = null;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new MultiModelDOMOverlay();
});
