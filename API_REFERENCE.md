# PBR Visualizer SDK API 参考

## 核心API

### PBRVisualizer

主要的可视化器类，提供完整的PBR渲染功能。

#### 构造函数

```typescript
new PBRVisualizer(options: VisualizerOptions)
```

创建一个新的PBR可视化器实例。

**参数：**
- `options: VisualizerOptions` - 初始化配置选项

**VisualizerOptions：**
```typescript
interface VisualizerOptions {
    container: HTMLElement;                    // 渲染容器
    models: Array<{
        id: string;                           // 模型唯一ID
        source: string;                       // 模型文件路径
        initialState?: Partial<ModelState>;   // 初始状态
    }>;
    initialGlobalState: GlobalState;          // 全局状态配置
    quality?: Partial<QualityConfig>;         // 质量配置
    debug?: boolean;                          // 调试模式
}
```

**示例：**
```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('viewer'),
    models: [{
        id: 'car',
        source: './models/car.glb'
    }],
    initialGlobalState: {
        environment: {
            url: './environments/studio.hdr',
            intensity: 1.0
        },
        camera: {
            position: [3, 2, 5],
            target: [0, 0, 0],
            fov: 45
        }
    }
});
```

#### 方法

##### initialize()

```typescript
async initialize(): Promise<void>
```

初始化可视化器。必须在使用其他方法之前调用。

**示例：**
```typescript
await visualizer.initialize();
```

##### loadModel()

```typescript
async loadModel(id: string, url: string, initialState?: Partial<ModelState>): Promise<void>
```

加载3D模型到场景中。

**参数：**
- `id: string` - 模型的唯一标识符
- `url: string` - 模型文件路径
- `initialState?: Partial<ModelState>` - 可选的初始状态

**示例：**
```typescript
await visualizer.loadModel('car', './models/sports-car.glb', {
    material: {
        color: '#ff0000',
        roughness: 0.2,
        metalness: 0.9
    }
});
```

##### updateModel()

```typescript
async updateModel(modelId: string, state: Partial<ModelState>): Promise<void>
```

更新指定模型的状态。

**参数：**
- `modelId: string` - 模型ID
- `state: Partial<ModelState>` - 要更新的状态

**示例：**
```typescript
await visualizer.updateModel('car', {
    material: {
        color: '#00ff00',
        roughness: 0.5
    },
    transform: {
        position: new THREE.Vector3(0, 1, 0)
    }
});
```

##### batchUpdate()

```typescript
async batchUpdate(updates: BatchUpdate[]): Promise<void>
```

批量更新多个模型的状态。

**参数：**
- `updates: BatchUpdate[]` - 更新列表

**示例：**
```typescript
await visualizer.batchUpdate([
    {
        modelId: 'car',
        state: { material: { roughness: 0.3 } }
    },
    {
        modelId: 'wheel',
        state: { visible: false }
    }
]);
```

##### undo()

```typescript
async undo(): Promise<void>
```

撤销上一次操作。

##### redo()

```typescript
async redo(): Promise<void>
```

重做上一次撤销的操作。

##### captureFrame()

```typescript
captureFrame(): string
```

截取当前画面，返回base64格式的图片数据。

**返回值：** `string` - base64图片数据

**示例：**
```typescript
const screenshot = visualizer.captureFrame();
document.body.appendChild(screenshot);
```

##### getPerformanceStats()

```typescript
getPerformanceStats(): PerformanceStats
```

获取当前性能统计信息。

**返回值：**
```typescript
interface PerformanceStats {
    fps: number;           // 帧率
    frameTime: number;     // 帧时间(ms)
    drawCalls: number;     // DrawCall数量
    triangles: number;     // 三角形数量
    memoryUsage: number;   // 内存使用(MB)
    gpuMemory: number;     // GPU内存(MB)
}
```

##### getCurrentState()

```typescript
getCurrentState(): SceneState
```

获取当前场景的完整状态。

#### 事件

##### on()

```typescript
on(event: string, listener: Function): void
```

注册事件监听器。

**支持的事件：**
- `'initialized'` - 初始化完成
- `'modelLoaded'` - 模型加载完成
- `'stateChange'` - 状态变更
- `'performance'` - 性能更新
- `'error'` - 错误发生
- `'undo'` - 撤销操作
- `'redo'` - 重做操作

**示例：**
```typescript
visualizer.on('modelLoaded', (event: ModelLoadedEvent) => {
    console.log(`Model ${event.modelId} loaded in ${event.loadTime}ms`);
});

visualizer.on('performance', (stats: PerformanceStats) => {
    if (stats.fps < 30) {
        console.warn('Performance warning: FPS below 30');
    }
});
```

##### off()

```typescript
off(event: string, listener: Function): void
```

移除事件监听器。

##### dispose()

```typescript
dispose(): void
```

销毁可视化器，清理所有资源。

#### 属性

##### initialized

```typescript
get initialized(): boolean
```

检查是否已初始化。

##### disposed

```typescript
get disposed(): boolean
```

检查是否已销毁。

## 核心系统API

### Renderer

核心渲染器类，管理WebGL渲染和性能监控。

#### 方法

##### initialize()

```typescript
async initialize(config?: {
    container?: HTMLElement;
    quality?: Partial<QualityConfig>;
}): Promise<void>
```

初始化渲染器。

##### render()

```typescript
render(): void
```

渲染单帧。

##### startRenderLoop()

```typescript
startRenderLoop(onRender?: (delta: number) => void): void
```

开始渲染循环。

##### onWindowResize()

```typescript
onWindowResize(width?: number, height?: number): void
```

处理窗口大小变化。

### EnvironmentSystem

环境映射系统，管理HDR环境贴图和IBL照明。

#### 方法

##### setEnvironment()

```typescript
async setEnvironment(config: EnvironmentConfig): Promise<void>
```

设置环境配置。

##### updateIntensity()

```typescript
updateIntensity(intensity: number): void
```

更新环境强度。

##### createProceduralEnvironment()

```typescript
createProceduralEnvironment(type: 'studio' | 'outdoor' | 'neutral'): void
```

创建程序化环境。

##### removeEnvironment()

```typescript
removeEnvironment(): void
```

移除环境贴图。

### LightSystem

灯光系统，管理场景中的所有光源。

#### 方法

##### createLight()

```typescript
createLight(id: string, config: LightState): THREE.Light
```

创建新的灯光。

##### updateLight()

```typescript
updateLight(id: string, config: Partial<LightState>): void
```

更新灯光配置。

##### createStudioLighting()

```typescript
createStudioLighting(modelBounds?: {
    center: THREE.Vector3;
    size: THREE.Vector3;
    radius: number;
}): void
```

创建Studio三点布光系统。

##### updateStudioLighting()

```typescript
updateStudioLighting(center: THREE.Vector3): void
```

更新Studio灯光位置。

### PostProcessSystem

后处理系统，管理SSAO、Bloom等后处理效果。

#### 方法

##### setConfig()

```typescript
setConfig(config: Partial<PostProcessState>): void
```

设置后处理配置。

##### render()

```typescript
render(): void
```

执行后处理渲染。

##### toggleSSAO()

```typescript
toggleSSAO(enabled?: boolean): void
```

切换SSAO效果。

### MaterialSystem

材质系统，管理PBR材质和纹理。

#### 方法

##### createMaterial()

```typescript
createMaterial(id: string, config: MaterialState): THREE.MeshStandardMaterial
```

创建PBR材质。

##### updateMaterial()

```typescript
updateMaterial(id: string, updates: Partial<MaterialState>): void
```

更新材质参数。

##### createPresetMaterial()

```typescript
createPresetMaterial(type: 'metal' | 'plastic' | 'wood' | 'glass' | 'fabric'): MaterialState
```

创建预设材质配置。

##### optimizeModelMaterials()

```typescript
optimizeModelMaterials(model: THREE.Object3D, environmentTexture?: THREE.Texture): void
```

优化模型的材质设置。

## 类型定义

### GlobalState

全局状态接口，描述环境、场景、灯光、相机与后处理的整体配置。

```typescript
interface GlobalState {
    environment: EnvironmentConfig;           // 环境贴图配置
    sceneSettings: {                         // 场景显示设置
        background: Color;
        exposure?: number;
        gamma?: number;
        toneMapping?: ToneMapping;
    };
    camera?: CameraState;                    // 相机参数
    postProcessing?: PostProcessState;       // 后处理参数
}
```

### ModelState

模型状态，包含动画、灯光、材质、变换等属性。

```typescript
interface ModelState {
    animations: AnimationState[];            // 动画参数
    light?: LightState[];                    // 灯光参数
    controls?: ControlState;                 // 控制参数
    material?: MaterialState;                // 材质参数
    visible: boolean;                        // 是否可见
    transform?: {                            // 变换参数
        position: Vector3;
        rotation: Euler;
        scale: Vector3;
    };
}
```

### MaterialState

PBR材质的基础参数。

```typescript
interface MaterialState {
    color: string | Color;                   // 基础颜色
    roughness: number;                       // 粗糙度
    metalness: number;                       // 金属度
    emissive?: string | Color;               // 自发光颜色
    emissiveIntensity?: number;              // 自发光强度
    normalScale?: number;                    // 法线强度
    aoMapIntensity?: number;                 // AO强度
    envMapIntensity?: number;                // 环境反射强度
}
```

### LightState

单盏灯的启用与参数配置。

```typescript
interface LightState {
    type: 'rectAreaLight' | 'pointLight' | 'spotLight' | 'directionalLight';
    enabled: boolean;                        // 是否启用
    color: Color;                            // 灯光颜色
    intensity: number;                       // 灯光强度
    position: Vector3;                       // 灯光位置
    size?: [number, number];                 // 矩形区域灯光大小
}
```

### EnvironmentConfig

环境配置，用于设置IBL环境强度与贴图URL。

```typescript
interface EnvironmentConfig {
    intensity?: number;                      // IBL环境强度
    url: string;                            // HDR/EXR贴图地址
}
```

### CameraState

透视相机的核心参数与交互控制。

```typescript
interface CameraState {
    position: Vector3;                       // 相机位置
    target: Vector3;                         // 观察目标点
    fov: number;                            // 视场角
    near: number;                           // 近裁剪面
    far: number;                            // 远裁剪面
    controls?: {                            // 交互控制
        enabled: boolean;
        autoRotate: boolean;
        autoRotateSpeed: number;
    };
}
```

### PostProcessState

后处理状态，包含色调映射、Bloom、SSAO、抗锯齿的配置。

```typescript
interface PostProcessState {
    enabled: boolean;                        // 是否启用后处理
    toneMapping: ToneMappingConfig;          // 色调映射参数
    bloom: BloomConfig;                      // Bloom泛光参数
    ssao: SSAOConfig;                        // SSAO接触阴影参数
    antialiasing: AntialiasingConfig;        // 抗锯齿参数
}
```

### QualityConfig

质量配置，控制分辨率、PMREM采样数等性能相关参数。

```typescript
interface QualityConfig {
    resolution: number;                      // 渲染分辨率比例
    maxSamples: number;                      // PMREM采样数
    mobileOptimized: boolean;                // 移动端优化
    textureFormat: 'sRGB8_ALPHA8' | 'RGBA8' | 'RGB8';
    maxTextureSize: number;                  // 纹理最大尺寸
}
```

### PerformanceStats

性能统计，包含帧率、内存使用等信息。

```typescript
interface PerformanceStats {
    fps: number;                            // 帧率
    frameTime: number;                      // 每帧耗时
    drawCalls: number;                      // DrawCall数量
    triangles: number;                      // 三角形数量
    memoryUsage: number;                    // 内存使用
    gpuMemory: number;                      // GPU内存
}
```

## 错误处理

### ErrorEvent

错误事件类型。

```typescript
interface ErrorEvent {
    type: 'render' | 'load' | 'state' | 'memory';
    message: string;                        // 错误消息
    stack?: string;                         // 堆栈信息
    recoverable: boolean;                   // 是否可恢复
}
```

### 错误处理示例

```typescript
visualizer.on('error', (event: ErrorEvent) => {
    console.error(`Error (${event.type}): ${event.message}`);

    if (!event.recoverable) {
        // 不可恢复错误，需要重新初始化
        visualizer.dispose();
    }
});
```

## 最佳实践

### 1. 初始化

```typescript
// 最佳初始化流程
const visualizer = new PBRVisualizer(options);

try {
    await visualizer.initialize();
    console.log('Visualizer ready');
} catch (error) {
    console.error('Initialization failed:', error);
}
```

### 2. 模型管理

```typescript
// 批量加载模型
const models = [
    { id: 'car', url: './models/car.glb' },
    { id: 'wheel', url: './models/wheel.glb' }
];

for (const model of models) {
    try {
        await visualizer.loadModel(model.id, model.url);
    } catch (error) {
        console.warn(`Failed to load model ${model.id}:`, error);
    }
}
```

### 3. 性能优化

```typescript
// 监控性能并调整质量
visualizer.on('performance', (stats) => {
    if (stats.fps < 30 && stats.fps > 0) {
        // 降低质量
        visualizer.setConfig({
            quality: {
                resolution: 0.8,
                mobileOptimized: true
            }
        });
    } else if (stats.fps > 55) {
        // 提升质量
        visualizer.setConfig({
            quality: {
                resolution: 1.0,
                mobileOptimized: false
            }
        });
    }
});
```

### 4. 资源清理

```typescript
// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (visualizer && !visualizer.disposed) {
        visualizer.dispose();
    }
});
```