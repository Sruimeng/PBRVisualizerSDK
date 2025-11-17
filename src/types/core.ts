import * as THREE from 'three';

// 基础数学类型
export type Vector3 = THREE.Vector3;
export type Euler = THREE.Euler;
export type Color = THREE.Color;

// 全局状态接口
export interface GlobalState {
  environment: EnvironmentConfig;
  camera: CameraState;
  postProcessing: PostProcessState;
  sceneSettings: {
    exposure: number;
    gamma: number;
    toneMapping: THREE.ToneMapping;
  };
}

// 环境配置
export interface EnvironmentConfig {
  type: 'noise-sphere' | 'hdr' | 'procedural';
  sphere?: {
    radius: number;
    pulse: boolean;
    frequency?: number;
    amplitude?: number;
  };
  hdr?: {
    url: string;
    intensity: number;
  };
  procedural?: {
    resolution: number;
    gradient: ColorGradient;
  };
}

// 相机状态
export interface CameraState {
  position: Vector3;
  target: Vector3;
  fov: number;
  near: number;
  far: number;
  controls?: {
    enabled: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
  };
}

// 后处理状态
export interface PostProcessState {
  enabled: boolean;
  toneMapping: ToneMappingConfig;
  bloom: BloomConfig;
  antialiasing: AntialiasingConfig;
}

export interface ToneMappingConfig {
  type: 'aces' | 'reinhard' | 'linear';
  exposure: number;
  whitePoint: number;
}

export interface BloomConfig {
  enabled: boolean;
  strength: number;
  radius: number;
  threshold: number;
}

export interface AntialiasingConfig {
  type: 'msaa' | 'fxaa' | 'taa';
  enabled: boolean;
}

// 材质状态
export interface MaterialState {
  color: string | Color;
  roughness: number;
  metalness: number;
  emissive?: string | Color;
  emissiveIntensity?: number;
  normalScale?: number;
  aoMapIntensity?: number;
  envMapIntensity?: number;
}

// 动画状态
export interface AnimationState {
  enabled: boolean;
  currentAnimation: number;
  speed: number;
  loop: boolean;
  playing: boolean;
}

// 模型状态
export interface ModelState {
  visible: boolean;
  transform: {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
  };
  materials: Record<string, MaterialState>;
  animations: AnimationState;
}

// 场景状态
export interface SceneState {
  global: GlobalState;
  models: Record<string, ModelState>;
}

// 模型源
export type ModelSource = string | File | Blob | ArrayBuffer | { url: string; type: string };

// 质量配置
export interface QualityConfig {
  resolution: number; // 0.5-1.0
  maxSamples: number; // PMREM采样数
  mobileOptimized: boolean;
  textureFormat: 'sRGB8_ALPHA8' | 'RGBA8' | 'RGB8';
  maxTextureSize: number;
}

// 性能统计
export interface PerformanceStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  gpuMemory: number;
}

// 状态事务
export interface StateTransaction {
  id: string;
  timestamp: number;
  previousState: SceneState;
  newState: SceneState;
  description?: string;
}

// 批量更新
export interface BatchUpdate {
  modelId: string;
  state: Partial<ModelState>;
}

export interface BatchOptions {
  duration: number;
  easing?: string;
  description?: string;
}

// 过渡选项
export interface TransitionOptions {
  duration: number;
  easing?: string;
  interpolate?: boolean;
}

// 颜色渐变
export interface ColorGradient {
  stops: Array<{
    position: number;
    color: string | Color;
  }>;
}

// 事件类型
export interface StateChangeEvent {
  stateId: string;
  updatedModels: string[];
  timestamp: number;
}

export interface ModelLoadedEvent {
  modelId: string;
  loadTime: number;
  triangleCount: number;
}

export interface ErrorEvent {
  type: 'render' | 'load' | 'state' | 'memory';
  message: string;
  stack?: string;
  recoverable: boolean;
}

// 配置选项
export interface VisualizerOptions {
  container: HTMLElement;
  models: Array<{
    id: string;
    source: ModelSource;
    initialState?: Partial<ModelState>;
  }>;
  initialGlobalState?: Partial<GlobalState>;
  quality?: Partial<QualityConfig>;
  debug?: boolean;
  autoResize?: boolean;
}

// 分享状态
export interface ShareState {
  version: string;
  state: SceneState;
  timestamp: number;
  checksum: string;
}