// 导出新的类型系统
export * from './types';

// 导出核心API
export { PBRVisualizer } from './PBRVisualizer';

// 导出核心系统（高级用户使用）
export { Renderer } from './core/Renderer';
export { EnvironmentSystem } from './core/EnvironmentSystem';
export { LightSystem } from './core/LightSystem';
export { PostProcessSystem } from './core/PostProcessSystem';
export { MaterialSystem } from './core/MaterialSystem';
export { AnimationStateMachine, EASING_FUNCTIONS, DEFAULT_EFFECT, FADE_PRESETS } from './core/AnimationStateMachine';

// 导出着色器（高级用户使用）
export { createIBLSphereMaterial, type IBLSphereUniforms } from './shaders/IBLSphere';
export { createNoiseSphereMaterial, type NoiseSphereUniforms } from './shaders/DynamicNoiseSphere';
export { createEquirectToCubeMaterial } from './shaders/EquirectToCubeUV';
export { createSGBMaterial, roughnessToMip, getSamplesForRoughness } from './shaders/SphericalGaussianBlur';
export {
    createSketchfabVignetteMaterial,
    createModelVignette,
    updateVignetteCenter,
    type SketchfabVignetteUniforms
} from './shaders/SketchfabVignette';

