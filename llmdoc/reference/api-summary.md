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
- `updatePostProcessing(config: PostProcessConfig): Promise<void>` - 更新后处理效果
- `setCamera(position: Vector3 | number[], target: Vector3 | number[]): void` - 设置相机
- `resetCamera(): void` - 重置相机到初始位置
- `updateControls(config: ControlsConfig): void` - 更新控制配置

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