# API概要参考

## 1. 核心类

### PBRVisualizer

主类，负责整个PBR可视化的管理和渲染。

```typescript
const visualizer = new PBRVisualizer(options: VisualizerOptions);
```

**核心方法:**
- `initialize(): Promise<void>` - 初始化可视化器
- `loadModel(id: string, source: string): Promise<void>` - 加载模型
- `updateModel(id: string, updates: ModelState): Promise<void>` - 更新模型状态
- `batchUpdate(updates: BatchUpdate[]): Promise<void>` - 批量更新多个模型
- `undo(): Promise<void>` - 撤销上一个事务
- `redo(): Promise<void>` - 重做下一个事务
- `getCurrentState(): SceneState` - 获取当前状态快照
- `updateEnvironment(config: EnvironmentConfig): Promise<void>` - 更新环境配置
- `updatePostProcessing(config: PostProcessState): Promise<void>` - 更新后处理效果
- `getPostProcessSystem(): PostProcessSystem` - 获取后处理系统实例
- `setCamera(position: Vector3 | number[], target: Vector3 | number[]): void` - 设置相机
- `resetCamera(): void` - 重置相机到初始位置
- `updateControls(config: ControlsConfig): void` - 更新控制配置

**暗角系统方法:**
- `setModelVignette(modelId: string, config: Partial<VignetteConfig>): void` - 设置模型暗角
- `createVignetteSphere(modelId: string, config: VignetteConfig): void` - 创建暗角球体（内部方法）
- `updateVignetteSphere(modelId: string): void` - 更新暗角球体参数（内部方法）
- `removeVignetteSphere(modelId: string): void` - 移除暗角球体（内部方法）
- `updateAllVignetteSpheres(): void` - 更新所有暗角球体位置（在渲染循环中调用）

**TransformControls系统方法:**
- `setModelTransformControls(modelId: string, config: Partial<TransformControlsConfig>): void` - 设置模型变换控制
- `createTransformControlsForModel(modelId: string, config: TransformControlsConfig): void` - 创建变换控制器（内部方法）
- `removeTransformControlsForModel(modelId: string): void` - 移除变换控制器（内部方法）
- `setTransformControlsMode(modelId: string, mode: 'translate' | 'rotate' | 'scale'): void` - 设置变换模式
- `setActiveTransformControls(modelId: string | null): void` - 设置活动的变换控制器

### 配置接口

### VisualizerOptions

```typescript
interface VisualizerOptions {
    container: HTMLElement;
    models: ModelConfig[];
    initialGlobalState?: GlobalState;
    debug?: boolean;
}
```

### BatchUpdate

```typescript
interface BatchUpdate {
    modelId: string;               // 模型ID
    state: Partial<ModelState>;    // 要更新的部分状态
}
```

### 事件类型

```typescript
// 事件监听
visualizer.on('stateChange', (event) => {
    // 状态变更事件
});

visualizer.on('undo', (event) => {
    // 撤销事件
});

visualizer.on('redo', (event) => {
    // 重做事件
});
```

### GlobalState

```typescript
interface GlobalState {
    environment?: EnvironmentState;
    camera?: CameraState;
    postProcessing?: PostProcessState;
    lights?: LightState;
    materials?: MaterialState; // 扩展支持透明材质参数
}
```

### ModelConfig

```typescript
interface ModelConfig {
    id: string;
    source: string;
    initialTransform?: TransformState;
}
```

### PostProcessSystem

后处理系统核心类，管理EffectComposer和渲染通道。

**核心方法:**
- `setConfig(config: Partial<PostProcessState>): void` - 设置后处理配置
- `setEnabled(enabled: boolean): void` - 启用/禁用后处理系统
- `render(): void` - 执行后处理渲染（自动检查isEnabled标志）
- `toggleSSAO(enabled?: boolean): void` - 切换SSAO效果
- `toggleBloom(enabled?: boolean): void` - 切换Bloom效果
- `adjustSSAOStrength(multiplier: number): void` - 调整SSAO强度
- `getCurrentConfig(): PostProcessState` - 获取当前配置
- `getPerformanceInfo(): PerformanceInfo` - 获取性能信息
- `setSize(width: number, height: number): void` - 调整画布尺寸
- `dispose(): void` - 清理资源

### PostProcessState

```typescript
interface PostProcessState {
    enabled: boolean;
    toneMapping: {
        type: THREE.ToneMapping;
        exposure: number;
        whitePoint: number;
    };
    bloom: {
        enabled: boolean;
        strength: number;
        radius: number;
        threshold: number;
    };
    ssao: {
        enabled: boolean;
        kernelRadius: number;
        minDistance: number;
        maxDistance: number;
    };
    antialiasing: {
        type: 'fxaa' | 'msaa';
        enabled: boolean;
    };
}
```

### VignetteConfig

```typescript
interface VignetteConfig {
    // 是否启用暗角球体；默认值：false
    enabled: boolean;
    // 暗角半径比例（相对于模型包围盒）；默认值：1.5
    radiusScale?: number;
    // 平滑度（暗角边缘渐变）；默认值：0.15
    smoothness?: number;
    // 暗角环半径；默认值：0.75
    ringRadius?: number;
    // 噪波强度；默认值：0.08
    noiseIntensity?: number;
    // 暗角颜色1（暗处）；默认值：#0f0c29
    color1?: Color | string;
    // 暗角颜色2（亮处）；默认值：#4a6fa5
    color2?: Color | string;
    // 暗角范围；默认值：0.85
    vignetteRange?: number;
    // 亮度补偿；默认值：0.10
    brightness?: number;
}
```

### TransformControlsConfig

```typescript
interface TransformControlsConfig {
    // 是否启用 TransformControls；默认值：false
    enabled: boolean;
    // 控制模式；默认值：'rotate'
    mode: 'translate' | 'rotate' | 'scale';
    // 控制器大小；默认值：1.0
    size?: number;
    // 是否显示 X 轴；默认值：true
    showX?: boolean;
    // 是否显示 Y 轴；默认值：true
    showY?: boolean;
    // 是否显示 Z 轴；默认值：true
    showZ?: boolean;
}
```

### PerformanceInfo

```typescript
interface PerformanceInfo {
    renderTime: number;    // 后处理渲染时间(ms)
    passCount: number;     // 渲染通道数量
    enabled: boolean;      // 是否启用后处理
}
```

## 2. 事件类型

### 事件监听

```typescript
visualizer.on(event: string, callback: Function): void;
```

**主要事件:**
- `modelLoaded` - 模型加载完成
- `error` - 错误发生
- `performance` - 性能监控数据
- `stateChanged` - 状态变化
- `environmentChanged` - 环境配置变化
- `postProcessingChanged` - 后处理效果变化

## 3. 常用使用模式

### 初始化模式
```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('viewer'),
    models: [{ id: 'model', source: 'model.glb' }],
    initialGlobalState: {
        environment: { url: 'hdr.hdr', intensity: 1.0 },
        camera: { position: [3, 2, 5], target: [0, 0, 0], fov: 40 }
    }
});
await visualizer.initialize();
```

### 批量更新模式
```typescript
await visualizer.batchUpdate([
    { id: 'model1', updates: { material: { color: '#ff0000' } } },
    { id: 'model2', updates: { transform: { position: [0, 1, 0] } } }
]);
```

### 错误处理模式
```typescript
visualizer.on('error', (error) => {
    console.error('错误类型:', error.type);
    console.error('错误信息:', error.message);
    console.error('错误时间:', error.timestamp);
});
```

## 4. 性能优化建议

1. **批量更新**: 使用`batchUpdate`方法减少渲染调用
2. **事件节流**: 对频繁触发的事件进行节流处理
3. **资源管理**: 及时清理不使用的模型和资源
4. **质量自适应**: 根据设备性能自动调整渲染质量