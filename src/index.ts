// 导出新的类型系统
export * from './types';

// 导出核心API
export { PBRVisualizer } from './PBRVisualizer';

// 导出核心系统（高级用户使用）
export {
  AnimationStateMachine,
  DEFAULT_EFFECT,
  EASING_FUNCTIONS,
  FADE_PRESETS,
} from './core/AnimationStateMachine';
export { EnvironmentSystem } from './core/EnvironmentSystem';
export { LightSystem } from './core/LightSystem';
export { MaterialSystem } from './core/MaterialSystem';
export { PostProcessSystem } from './core/PostProcessSystem';
export { Renderer } from './core/Renderer';

// 导出着色器（高级用户使用）
export { createNoiseSphereMaterial, type NoiseSphereUniforms } from './shaders/DynamicNoiseSphere';
export { createEquirectToCubeMaterial } from './shaders/EquirectToCubeUV';
export { createIBLSphereMaterial, type IBLSphereUniforms } from './shaders/IBLSphere';
export {
  createModelVignette,
  createSketchfabVignetteMaterial,
  updateVignetteCenter,
  type SketchfabVignetteUniforms,
} from './shaders/SketchfabVignette';
export {
  createSGBMaterial,
  getSamplesForRoughness,
  roughnessToMip,
} from './shaders/SphericalGaussianBlur';
