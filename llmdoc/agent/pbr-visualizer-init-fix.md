# PBRVisualizer初始化选项修复说明

## 问题描述

在 `src/PBRVisualizer.ts` 的 `initializeOptions` 方法中发现以下问题:

1. **models数组未处理**: `VisualizerOptions` 中的 `models` 数组是必传参数,但在初始化时被忽略,直接设置为空对象 `{}`
2. **缺少模型初始状态**: 没有为每个模型创建默认的初始状态(材质、控制器、变换等)
3. **模型未自动加载**: 配置的模型需要手动调用 `loadModel()`,不符合"配置即用"的设计理念
4. **缺少Studio灯光**: 虽然 `loadModel` 方法中有调用 `setupStudioLighting()`,但初始化时不会自动加载模型

## 修复内容

### 1. 修复 `initializeOptions` 方法

**修复前:**

```typescript
private initializeOptions(options: VisualizerOptions): void {
    // ...创建默认全局状态...

    // 合并用户配置
    this.currentState = {
        global: { ...defaultGlobalState, ...options.initialGlobalState },
        models: {}  // ❌ 直接设为空对象,忽略了options.models
    };
}
```

**修复后:**

```typescript
private initializeOptions(options: VisualizerOptions): void {
    // ...创建默认全局状态...

    // 初始化模型状态映射
    const modelsState: Record<string, ModelState> = {};

    // 为每个模型创建初始状态
    options.models.forEach(modelConfig => {
        const defaultModelState: ModelState = {
            animations: [],
            visible: true,
            transform: {
                position: new THREE.Vector3(0, 0, 0),
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1)
            },
            material: {
                color: '#ffffff',
                metalness: 0.5,
                roughness: 0.5,
                envMapIntensity: 1.0
            },
            controls: {
                enabled: true,
                autoRotate: false,
                autoRotateSpeed: 1.0
            }
        };

        // 合并用户提供的初始状态
        modelsState[modelConfig.id] = {
            ...defaultModelState,
            ...modelConfig.initialState
        };
    });

    this.currentState = {
        global: { ...defaultGlobalState, ...options.initialGlobalState },
        models: modelsState  // ✅ 使用处理后的模型状态
    };
}
```

### 2. 添加 `loadInitialModels` 方法

新增方法用于在初始化时自动加载所有配置的模型:

```typescript
/**
 * 加载初始模型
 */
private async loadInitialModels(): Promise<void> {
    const loadPromises = this.options.models.map(async (modelConfig) => {
        try {
            await this.loadModel(
                modelConfig.id,
                modelConfig.source,
                modelConfig.initialState
            );
        } catch (error) {
            console.error(`Failed to load model ${modelConfig.id}:`, error);
            // 继续加载其他模型,不因一个模型失败而中断
        }
    });

    await Promise.all(loadPromises);
}
```

### 3. 修改构造函数

保存 `options` 以便后续使用:

```typescript
// 配置选项
private options: VisualizerOptions;

constructor(options: VisualizerOptions) {
    this.options = options; // ✅ 保存配置选项
    this.initializeOptions(options);
    this.setupCoreSystems();
    this.setupLoader();
    this.setupEventListeners();

    console.log('PBRVisualizer created');
}
```

### 4. 修改 `initialize` 方法

在初始化流程中调用 `loadInitialModels`:

```typescript
public async initialize(): Promise<void> {
    if (this.isInitialized) {
        console.warn('PBRVisualizer is already initialized');
        return;
    }

    try {
        // 初始化渲染器
        await this.renderer.initialize();

        // 应用全局状态
        await this.applyGlobalState(this.currentState.global);

        // ✅ 加载所有配置的模型
        await this.loadInitialModels();

        // 设置轨道控制器
        this.setupControls();

        // 开始渲染循环
        this.startRenderLoop();

        this.isInitialized = true;
        this.emit('initialized');

        console.log('PBRVisualizer initialized successfully');
    } catch (error) {
        this.handleError('state', error as Error);
        throw error;
    }
}
```

## 修复效果

### 修复前的问题

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('app'),
    models: [
        {
            id: 'sphere',
            source: '/models/sphere.glb',
            initialState: {
                material: { metalness: 1.0, roughness: 0.2 }
            }
        }
    ],
    initialGlobalState: { /* ... */ }
});

await visualizer.initialize();
// ❌ 模型不会自动加载
// ❌ 需要手动调用: await visualizer.loadModel('sphere', '/models/sphere.glb')
```

### 修复后

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('app'),
    models: [
        {
            id: 'sphere',
            source: '/models/sphere.glb',
            initialState: {
                material: { metalness: 1.0, roughness: 0.2 }
            }
        }
    ],
    initialGlobalState: { /* ... */ }
});

await visualizer.initialize();
// ✅ 模型自动加载
// ✅ 自动应用initialState中的材质配置
// ✅ 自动创建Studio灯光(通过loadModel中的setupStudioLighting)
// ✅ 自动应用控制器配置
```

## 实现细节

### 模型状态初始化流程

1. **构造阶段** (`constructor`):

   - 保存 `options`
   - 调用 `initializeOptions` 创建所有模型的初始状态
   - 此时模型状态已创建,但3D对象尚未加载

2. **初始化阶段** (`initialize`):

   - 初始化渲染器
   - 应用全局状态
   - **调用 `loadInitialModels` 加载所有模型**
   - 设置控制器
   - 开始渲染循环

3. **模型加载** (`loadModel`):
   - 加载GLTF模型
   - 处理模型(缩放、居中)
   - 添加到场景
   - **自动调用 `setupStudioLighting` 创建跟随灯光**
   - 触发 `modelLoaded` 事件

### Studio灯光系统

`setupStudioLighting` 方法会为每个模型创建:

- 主光源 (Key Light)
- 补光 (Fill Light)
- 背光/轮廓光 (Rim Light)

这些灯光会根据模型的包围盒自动定位,确保最佳照明效果。

## 相关文件

- `src/PBRVisualizer.ts` - 主要修改文件
- `src/types/core.ts` - 类型定义
- `src/core/LightSystem.ts` - 灯光系统实现

## 测试建议

1. **基础功能测试**:

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('app'),
    models: [{
        id: 'test',
        source: '/models/test.glb'
    }],
    initialGlobalState: { /* ... */ }
});

await visualizer.initialize();
// 验证: 模型已加载,灯光已创建,渲染正常
```

2. **多模型测试**:

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('app'),
    models: [
        { id: 'model1', source: '/models/model1.glb' },
        { id: 'model2', source: '/models/model2.glb' },
        { id: 'model3', source: '/models/model3.glb' }
    ],
    initialGlobalState: { /* ... */ }
});

await visualizer.initialize();
// 验证: 所有模型并行加载,每个都有独立的Studio灯光
```

3. **初始状态测试**:

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('app'),
    models: [{
        id: 'sphere',
        source: '/models/sphere.glb',
        initialState: {
            material: {
                color: '#ff0000',
                metalness: 1.0,
                roughness: 0.1
            },
            transform: {
                position: new Vector3(2, 0, 0),
                rotation: new Euler(0, Math.PI / 4, 0),
                scale: new Vector3(2, 2, 2)
            }
        }
    }],
    initialGlobalState: { /* ... */ }
});

await visualizer.initialize();
// 验证: 模型应用了自定义材质和变换
```

## 向后兼容性

✅ 此修复保持向后兼容:

- 原有的 `loadModel` API 仍然可用
- 手动加载模型的方式仍然有效
- 仅增强了初始化流程,未破坏现有功能

## 相关问题

- [x] models数组未被处理
- [x] 缺少模型初始状态
- [x] 模型未自动加载
- [x] Studio灯光系统已实现(在loadModel中)
- [x] 控制器初始化已完善

## 下一步

建议后续优化:

1. 添加模型加载进度回调
2. 支持模型加载失败的降级策略
3. 优化多模型并行加载的性能
4. 为每个模型提供独立的控制器配置
