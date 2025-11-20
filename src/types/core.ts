import { Color, Euler, ToneMapping, Vector3 } from 'three';

// 全局状态接口：描述环境、场景、灯光、相机与后处理的整体配置
export interface GlobalState {
  // 环境贴图配置
  environment: EnvironmentConfig;
  // 场景显示设置；默认值：exposure 1.0，gamma 2.2，toneMapping ACES
  sceneSettings: {
    // 场景背景颜色；默认值：(0,0,0)
    background: Color;
    // 曝光；默认值：1.0
    exposure?: number;
    // 伽马校正；默认值：2.2
    gamma?: number;
    // 色调映射类型；默认值：ACESFilmicToneMapping
    toneMapping?: ToneMapping;
  };
  // 相机参数
  camera?: CameraState;
  // 后处理参数
  postProcessing?: PostProcessState;
}

// 灯光状态：单盏灯的启用与参数（颜色、强度、位置）
export interface LightState {
  // 灯光类型；默认值：rectAreaLight
  type: 'rectAreaLight' | 'pointLight' | 'spotLight' | 'directionalLight';
  // 是否启用此灯光；默认值：true
  enabled: boolean;
  // 灯光颜色
  color: Color;
  // 灯光强度
  intensity: number;
  // 灯光位置
  position: Vector3;
  // 矩形区域灯光大小；默认值：(1,1)
  size?: [number, number];
}

// 环境配置：用于设置 IBL 环境强度与贴图 URL
export interface EnvironmentConfig {
  // IBL 环境强度；默认值：1.0
  intensity?: number;
  // HDR/EXR 贴图地址
  url: string;
}

// 相机状态：透视相机的核心参数与交互控制
export interface CameraState {
  // 相机位置；默认值：(3,2,5)
  position: Vector3;
  // 观察目标点；默认值：(0,0,0)
  target: Vector3;
  // 视场角；默认值：40（度）
  fov: number;
  // 近裁剪面；默认值：0.1
  near: number;
  // 远裁剪面；默认值：1000
  far: number;
  // 交互控制；默认值：enabled true，autoRotate false，speed 1.0
  controls?: {
    // 是否启用控制；默认值：true
    enabled: boolean;
    // 是否自动旋转；默认值：false
    autoRotate: boolean;
    // 自动旋转速度；默认值：1.0
    autoRotateSpeed: number;
  };
}

// 后处理状态：包含色调映射、Bloom、SSAO、抗锯齿的总体开关与参数
export interface PostProcessState {
  // 是否启用后处理；默认值：true
  enabled: boolean;
  // 色调映射参数；默认值：type ACES，exposure 1.0，whitePoint 1.0
  toneMapping: ToneMappingConfig;
  // Bloom 泛光参数；默认值：enabled true，strength 0.5，radius 0.4，threshold 0.8
  bloom: BloomConfig;
  // SSAO 接触阴影参数；默认值：enabled false，kernel 4，min 0.005，max 0.1
  ssao: SSAOConfig;
  // 抗锯齿参数；默认值：type 'fxaa'，enabled true
  antialiasing: AntialiasingConfig;
}

// SSAO 接触阴影配置
export interface SSAOConfig {
  // 是否启用 SSAO；默认值：false
  enabled: boolean;
  // 采样核半径；默认值：4
  kernelRadius: number;
  // 最小距离；默认值：0.005
  minDistance: number;
  // 最大距离；默认值：0.1
  maxDistance: number;
}

// 色调映射配置：类型、曝光与白点
export interface ToneMappingConfig {
  // 色调映射类型；默认值：ACESFilmicToneMapping
  type: ToneMapping;
  // 曝光；默认值：1.0
  exposure: number;
  // 白点；默认值：1.0
  whitePoint: number;
}

// Bloom 泛光配置
export interface BloomConfig {
  // 是否启用 Bloom；默认值：true
  enabled: boolean;
  // 强度；默认值：0.5
  strength: number;
  // 半径；默认值：0.4
  radius: number;
  // 阈值；默认值：0.8
  threshold: number;
}

// 抗锯齿配置：类型与开关
export interface AntialiasingConfig {
  // 抗锯齿类型；默认值：'fxaa'
  type: 'msaa' | 'fxaa' | 'taa';
  // 是否启用抗锯齿；默认值：true
  enabled: boolean;
}

// 材质状态：PBR 材质的基础参数
export interface MaterialState {
  // 基础颜色；默认值：#ffffff
  color: string | Color;
  // 粗糙度；默认值：0.4
  roughness: number;
  // 金属度；默认值：0.2
  metalness: number;
  // 自发光颜色；默认值：#000000
  emissive?: string | Color;
  // 自发光强度；默认值：0.0
  emissiveIntensity?: number;
  // 法线强度；默认值：1.0
  normalScale?: number;
  // AO 强度；默认值：1.0
  aoMapIntensity?: number;
  // 环境反射强度；默认值：1.0
  envMapIntensity?: number;
}

// 动画状态：当前动画索引、速度与循环播放开关
export interface AnimationState {
  // 动画 ID；默认值：必填  (不能重复, 用于后续动画状态更新)
  id: string,
  // 是否启用动画；默认值：false
  enabled: boolean;
  // 当前动画索引；默认值：0
  currentAnimation: number;
  // 播放速度；默认值：1.0
  speed: number;
  // 是否循环；默认值：true
  loop: boolean;
  // 是否正在播放；默认值：false
  playing: boolean;
}

// 模型状态：可见性、变换、材质与动画集合
export interface ModelState {
  // 动画参数
  animations: AnimationState[];
  // 灯光参数；默认值：[]
  light?: LightState[];
  // 材质参数
  material?: MaterialState;
  // 模型是否可见；默认值：true
  visible: boolean;
  // 变换参数；默认值：position(0,0,0)、rotation(0,0,0)、scale(1,1,1)
  transform?: {
    // 位置；默认值：(0,0,0)
    position: Vector3;
    // 旋转；默认值：(0,0,0)
    rotation: Euler;
    // 缩放；默认值：(1,1,1)
    scale: Vector3;
  };
}

// 场景状态：全局状态与模型集合
export interface SceneState {
  // 全局状态；默认值：见下方 DefaultGlobalState
  global: GlobalState;
  // 模型状态表；默认值：{}
  models: Record<string, ModelState>;
}
// 质量配置：分辨率、PMREM 采样数、移动端优化与纹理约束
export interface QualityConfig {
  // 渲染分辨率比例（0.5-1.0）；默认值：1.0
  resolution: number; // 0.5-1.0
  // PMREM 采样数；默认值：16
  maxSamples: number; // PMREM采样数
  // 移动端优化开关；默认值：false
  mobileOptimized: boolean;
  // 纹理格式；默认值：'sRGB8_ALPHA8'
  textureFormat: 'sRGB8_ALPHA8' | 'RGBA8' | 'RGB8';
  // 纹理最大尺寸；默认值：2048
  maxTextureSize: number;
}

// 性能统计：帧率、帧时间与 GPU/几何信息
export interface PerformanceStats {
  // 帧率；默认值：动态采集
  fps: number;
  // 每帧耗时（ms）；默认值：动态采集
  frameTime: number;
  // DrawCall 数；默认值：动态采集
  drawCalls: number;
  // 三角形数量；默认值：动态采集
  triangles: number;
  // 内存使用（MB）；默认值：动态采集
  memoryUsage: number;
  // GPU 内存（MB）；默认值：动态采集
  gpuMemory: number;
}

// 状态事务：撤销/重做所需的前后状态快照
export interface StateTransaction {
  // 事务 ID；默认值：运行时生成
  id: string;
  // 时间戳；默认值：运行时生成
  timestamp: number;
  // 之前状态快照
  previousState: SceneState;
  // 新状态快照
  newState: SceneState;
  // 描述信息；默认值：undefined
  description?: string;
}

// 批量更新：一次性对多个模型做部分状态更新
export interface BatchUpdate {
  // 模型 ID
  modelId: string;
  // 要更新的部分状态
  state: Partial<ModelState>;
}

export interface BatchOptions {
  // 动画时长（ms）；默认值：300
  duration: number;
  // 缓动类型；默认值：'easeOutCubic'
  easing?: string;
  // 描述信息
  description?: string;
}

// 过渡选项：动画过渡控制
export interface TransitionOptions {
  // 过渡时长（ms）；默认值：300
  duration: number;
  // 缓动类型；默认值：'easeOutCubic'
  easing?: string;
  // 是否插值过渡；默认值：true
  interpolate?: boolean;
}

// 颜色渐变：用于程序化背景或材质渐变
export interface ColorGradient {
  // 渐变关键点列表
  stops: Array<{
    // 位置（0-1）；默认值：按需
    position: number;
    // 颜色；默认值：按需
    color: string | Color;
  }>;
}

// 事件类型：状态变更与模型加载等事件的载荷
export interface StateChangeEvent {
  // 状态 ID
  stateId: string;
  // 受影响的模型列表
  updatedModels: string[];
  // 变更时间戳
  timestamp: number;
}

export interface ModelLoadedEvent {
  // 模型 ID
  modelId: string;
  // 加载耗时（ms）
  loadTime: number;
  // 三角形数量
  triangleCount: number;
}

export interface ErrorEvent {
  // 错误类型
  type: 'render' | 'load' | 'state' | 'memory';
  // 错误消息
  message: string;
  // 堆栈信息
  stack?: string;
  // 是否可恢复
  recoverable: boolean;
}

// 配置选项：初始化 PBR 可视化器所需的参数
export interface VisualizerOptions {
  // 容器元素（用于挂载 Canvas）；默认：必填
  container: HTMLElement;
  // 模型列表；默认：[]
  models: {
    // 模型来源（URL、本地路径等）；默认：必填
    source: string;
    // 模型 ID；默认：必填  (不能重复, 用于后续模型状态更新)
    id: string;
    // 初始模型状态
    initialState?: Partial<ModelState>;
  }[];
  // 初始全局状态；
  initialGlobalState: GlobalState;
  // 质量配置
  quality?: Partial<QualityConfig>;
  // 是否开启调试信息；默认：false
  debug?: boolean;
}
