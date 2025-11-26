import * as THREE from 'three';
import type {
  CameraState,
  EnvironmentConfig,
  GlobalState,
  PerformanceStats,
  QualityConfig,
} from '../types';

/**
 * 核心渲染器类
 *
 * 负责：
 * - WebGL渲染器的创建和配置
 * - 渲染循环管理
 * - 性能监控
 * - 画布尺寸管理
 * - 渲染质量控制
 */
export class Renderer {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public canvas: HTMLCanvasElement;

  private clock = new THREE.Clock();
  private isInitialized = false;
  private isDisposed = false;

  // 性能监控
  private performanceStats: PerformanceStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0,
    gpuMemory: 0,
  };

  // 帧率计算
  private frameCount = 0;
  private fpsUpdateTime = 0;

  constructor() {
    // 初始化Three.js核心组件
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(3, 2, 5);

    // 创建WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      alpha: true,
      stencil: true,
      depth: true,
      antialias: false,
    });

    this.canvas = this.renderer.domElement;
    this.configureRenderer();
  }

  /**
   * 配置渲染器参数（基于ai_studio_code.html的优化配置）
   */
  private configureRenderer(): void {
    // 基础配置
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // PBR渲染配置
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    // Note: useLegacyLights property was removed in Three.js r152+

    // 阴影配置（暂时关闭，使用后处理阴影）
    this.renderer.shadowMap.enabled = false;

    // 输出色彩空间
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 性能优化
    this.renderer.info.autoReset = false;
  }

  /**
   * 初始化渲染器
   */
  public async initialize(config?: {
    container?: HTMLElement;
    quality?: Partial<QualityConfig>;
  }): Promise<void> {
    if (this.isInitialized) {
      console.warn('Renderer is already initialized');
      return;
    }

    try {
      // 如果提供了容器，添加canvas到容器
      if (config?.container) {
        config.container.appendChild(this.canvas);
      }

      // 应用质量配置
      if (config?.quality) {
        this.applyQualitySettings(config.quality);
      }

      // 设置初始场景状态
      this.applyGlobalState({
        environment: { url: '', intensity: 1.0 },
        sceneSettings: {
          background: new THREE.Color(0x000000),
          exposure: 1.0,
          toneMapping: THREE.ACESFilmicToneMapping,
        },
      });

      this.isInitialized = true;
      console.log('Renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize renderer:', error);
      throw error;
    }
  }

  /**
   * 应用全局状态
   */
  public applyGlobalState(state: GlobalState): void {
    // 场景设置
    if (state.sceneSettings) {
      this.applySceneSettings(state.sceneSettings);
    }

    // 环境配置
    if (state.environment) {
      this.applyEnvironmentConfig(state.environment);
    }

    // 相机设置
    if (state.camera) {
      this.applyCameraSettings(state.camera);
    }
  }

  /**
   * 应用场景设置
   */
  private applySceneSettings(settings: GlobalState['sceneSettings']): void {
    // 背景颜色
    this.scene.background = settings.background;

    // 曝光设置
    if (settings.exposure !== undefined) {
      this.renderer.toneMappingExposure = settings.exposure;
    }

    // 色调映射
    if (settings.toneMapping !== undefined) {
      this.renderer.toneMapping = settings.toneMapping;
    }
  }

  /**
   * 应用环境配置
   */
  private applyEnvironmentConfig(config: EnvironmentConfig): void {
    // 环境贴图加载将由EnvironmentSystem处理
    // 这里只设置强度
    if (this.scene.environment) {
      this.scene.environmentIntensity = config.intensity || 1.0;
    }
  }

  /**
   * 应用相机设置
   */
  private applyCameraSettings(settings: CameraState): void {
    this.camera.position.copy(settings.position);
    this.camera.lookAt(settings.target);
    this.camera.fov = settings.fov;
    this.camera.near = settings.near;
    this.camera.far = settings.far;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 应用质量设置
   */
  private applyQualitySettings(quality: Partial<QualityConfig>): void {
    if (quality.resolution !== undefined) {
      const scale = quality.resolution;
      this.renderer.setSize(window.innerWidth * scale, window.innerHeight * scale);
    }

    // 设置纹理最大尺寸
    if (quality.maxTextureSize) {
      // 需要在加载纹理时应用此限制
      console.log(
        `Max texture size: ${Math.min(quality.maxTextureSize, this.renderer.capabilities.maxTextureSize)}`,
      );
    }
  }

  /**
   * 渲染单帧
   */
  public render(): void {
    if (this.isDisposed) return;

    const startTime = performance.now();

    // 执行渲染
    this.renderer.render(this.scene, this.camera);

    // 更新性能统计
    this.updatePerformanceStats(performance.now() - startTime);
  }

  /**
   * 开始渲染循环
   */
  public startRenderLoop(onRender?: (delta: number) => void): void {
    if (this.isDisposed) return;

    const animate = () => {
      if (this.isDisposed) return;

      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      // 执行用户自定义渲染逻辑
      if (onRender) {
        onRender(delta);
      }

      // 执行渲染
      this.render();
    };

    animate();
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(frameTime: number): void {
    const now = performance.now();
    this.frameCount++;

    // 每秒更新一次FPS
    if (now - this.fpsUpdateTime > 1000) {
      this.performanceStats.fps = Math.round((this.frameCount * 1000) / (now - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    // 更新帧时间
    this.performanceStats.frameTime = frameTime;

    // 更新渲染统计
    const info = this.renderer.info;
    this.performanceStats.drawCalls = info.render.calls;
    this.performanceStats.triangles = info.render.triangles;

    // 重置统计信息（每帧）
    if (this.frameCount % 60 === 0) {
      info.autoReset = true;
      info.reset();
      info.autoReset = false;
    }
  }

  /**
   * 处理窗口大小变化
   */
  public onWindowResize(width?: number, height?: number): void {
    const w = width || window.innerWidth;
    const h = height || window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }

  /**
   * 获取当前性能统计
   */
  public getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  /**
   * 获取渲染器信息
   */
  public getRendererInfo() {
    return {
      ...this.renderer.info,
      capabilities: this.renderer.capabilities,
      context: this.renderer.getContext(),
      pixelRatio: this.renderer.getPixelRatio(),
      drawingBufferSize: this.renderer.getDrawingBufferSize(new THREE.Vector2()),
    };
  }

  /**
   * 截图功能
   */
  public captureFrame(format: 'png' | 'jpeg' = 'png', quality = 0.9): string {
    return this.renderer.domElement.toDataURL(`image/${format}`, quality);
  }

  /**
   * 销毁渲染器
   */
  public dispose(): void {
    if (this.isDisposed) return;

    // 清理场景
    this.scene.clear();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      }
    });

    // 销毁渲染器
    this.renderer.dispose();

    // 从DOM中移除canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.isDisposed = true;
    console.log('Renderer disposed');
  }

  /**
   * 检查是否已初始化
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 检查是否已销毁
   */
  public get disposed(): boolean {
    return this.isDisposed;
  }
}
