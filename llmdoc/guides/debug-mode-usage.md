# Debug模式使用指南

在PBR Visualizer SDK中启用和使用完整的Debug系统，包括灯光Helper可视化、Buffer调试和性能监控。

## 1. 启用Debug模式

### 基础启用

```javascript
import { PBRVisualizer } from 'pbr-visualizer-sdk';

const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas'),
    // ... 其他配置
});

// 启用Debug模式
visualizer.debug.enable();
```

### 初始化时启用

```javascript
const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas'),
    debug: {
        enabled: true,          // 初始化时启用
        showPanel: true,        // 显示lil-gui面板
        lightHelpers: {
            enabled: false,     // 初始不显示灯光Helper
            scale: 1.0
        },
        bufferVisualization: {
            enabled: false,     // 初始不显示Buffer可视化
            mode: 'Default'
        },
        performance: {
            showStats: true,    // 显示性能统计
            showPassTimings: false
        }
    }
});
```

## 2. 灯光Helper可视化

### 显示所有灯光Helper

```javascript
// 启用所有灯光Helper
visualizer.debug.setLightHelpersEnabled(true);

// 禁用所有灯光Helper
visualizer.debug.setLightHelpersEnabled(false);
```

### 获取Helper信息

```javascript
// 获取所有灯光Helper的信息
const helperInfo = visualizer.debug.getLightHelperInfo();
console.log('灯光Helper列表:', helperInfo);
// 输出: [
//   { id: 'studio_keyLight', type: 'rectAreaLight', visible: true },
//   { id: 'studio_fillLight', type: 'rectAreaLight', visible: true },
//   { id: 'studio_rimLight', type: 'rectAreaLight', visible: true },
//   { id: 'custom_light_1', type: 'pointLight', visible: true }
// ]
```

### 调整Helper显示

```javascript
// 通过lil-gui面板UI调整（自动映射到setLightHelpersEnabled）
// 或通过代码：
visualizer.debug.setLightHelpersEnabled(true);

// 支持的Helper类型：
// - RectAreaLight（矩形区域灯光，用于Studio三点布光）
// - PointLight（点光源）
// - SpotLight（聚光灯）
// - DirectionalLight（平行光）
```

## 3. Buffer可视化调试

### 设置输出模式

```javascript
import { SSAOOutputMode } from 'pbr-visualizer-sdk';

// 查看深度Buffer
visualizer.debug.setBufferVisualizationMode(SSAOOutputMode.Depth);

// 查看SSAO纹理
visualizer.debug.setBufferVisualizationMode(SSAOOutputMode.SSAO);

// 查看法线Buffer
visualizer.debug.setBufferVisualizationMode(SSAOOutputMode.Normal);

// 重置为默认合成输出
visualizer.debug.setBufferVisualizationMode(SSAOOutputMode.Default);
```

### 循环切换模式

```javascript
// 快速循环切换5种模式
visualizer.debug.cycleBufferMode();

// 支持的模式：
// 0: Default - 合成后的最终输出
// 1: SSAO - 原始SSAO纹理
// 2: Blur - 模糊后的SSAO
// 3: Depth - 深度Buffer
// 4: Normal - 法线Buffer
```

### 重置Buffer模式

```javascript
// 重置为默认合成模式
visualizer.debug.resetBufferMode();
```

## 4. 性能监控

### 查看性能数据

```javascript
// 通过lil-gui面板实时查看：
// - FPS：每秒帧数
// - DrawCalls：绘制调用次数
// - 三角形：当前场景三角形总数

// 通过代码获取性能状态
const debugState = visualizer.debug.getState();
console.log('调试状态:', debugState);
// 输出: {
//   enabled: true,
//   activeLightHelpers: ['studio_keyLight', 'studio_fillLight', ...],
//   bufferMode: SSAOOutputMode.Default,
//   panelVisible: true
// }
```

## 5. UI面板控制

### 显示/隐藏面板

```javascript
// 显示调试面板
visualizer.debug.setPanelVisible(true);

// 隐藏调试面板
visualizer.debug.setPanelVisible(false);

// 切换面板显示
visualizer.debug.togglePanel();
```

### 面板结构

调试面板包含4个文件夹：

1. **💡 灯光Helper** - 显示/隐藏灯光Helper可视化
2. **🖼️ Buffer可视化** - 选择Buffer输出模式、快速切换、重置
3. **✨ 后处理** - SSAO和Bloom开关控制
4. **📊 性能** - 实时性能指标（FPS、DrawCalls、三角形数）

## 6. 完整使用示例

```javascript
import { PBRVisualizer, SSAOOutputMode } from 'pbr-visualizer-sdk';

// 初始化SDK并启用Debug
const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas'),
    debug: { enabled: true }
});

// 加载模型
const model = await visualizer.loadModel('/path/to/model.gltf', {
    generateStudioLighting: true
});

// 启用灯光Helper查看Studio三点布光
visualizer.debug.setLightHelpersEnabled(true);

// 调试深度Buffer
visualizer.debug.setBufferVisualizationMode(SSAOOutputMode.Depth);

// 查看当前调试状态
const state = visualizer.debug.getState();
console.log('激活的Helper:', state.activeLightHelpers);
console.log('Buffer模式:', state.bufferMode);

// 使用lil-gui面板进行实时调整
// - 切换Helper显示
// - 循环切换Buffer模式
// - 调整后处理效果
// - 监控渲染性能
```

## 7. 编程API参考

### 主要方法

- `enable()` - 启用调试模式
- `disable()` - 禁用调试模式
- `toggle()` - 切换调试模式状态
- `setLightHelpersEnabled(enabled)` - 显示/隐藏灯光Helper
- `setBufferVisualizationMode(mode)` - 设置Buffer可视化模式
- `cycleBufferMode()` - 循环切换Buffer模式
- `resetBufferMode()` - 重置Buffer模式到默认
- `setPanelVisible(visible)` - 显示/隐藏UI面板
- `togglePanel()` - 切换UI面板显示
- `getState()` - 获取当前调试状态
- `getConfig()` - 获取调试配置
- `setConfig(config)` - 设置调试配置
- `getLightHelperInfo()` - 获取灯光Helper信息列表
- `dispose()` - 销毁调试系统

### 属性

- `enabled` - 返回是否已启用调试模式（只读）

## 8. Studio三点布光Helper可视化

当使用 `generateStudioLighting: true` 加载模型时，调试面板会自动显示3个Studio灯光：

```javascript
// 自动创建Studio三点布光
const model = await visualizer.loadModel('/path/to/model.gltf', {
    generateStudioLighting: true
});

// 启用Helper后将看到3个矩形区域灯光的可视化框
visualizer.debug.setLightHelpersEnabled(true);

// 获取Studio灯光引用进行调整
const helperInfo = visualizer.debug.getLightHelperInfo();
const studioHelpers = helperInfo.filter(h => h.id.startsWith('studio_'));
console.log('Studio灯光Helper:', studioHelpers);
// 输出: [
//   { id: 'studio_keyLight', type: 'rectAreaLight', visible: true },
//   { id: 'studio_fillLight', type: 'rectAreaLight', visible: true },
//   { id: 'studio_rimLight', type: 'rectAreaLight', visible: true }
// ]
```

## 9. 调试工作流

### 调试灯光设置

1. 启用Debug模式：`visualizer.debug.enable()`
2. 显示灯光Helper：通过面板或 `setLightHelpersEnabled(true)`
3. 观察灯光位置和方向
4. 在代码中调整灯光参数后，通过UI实时查看效果

### 调试后处理效果

1. 通过Buffer可视化逐个检查渲染Pass结果
2. 使用 `cycleBufferMode()` 快速浏览各个Buffer
3. 对比不同模式下的差异，诊断效果问题

### 性能优化

1. 实时监控FPS、DrawCalls和三角形数
2. 通过调整后处理质量进行优化
3. 对比优化前后的性能指标

## 10. 注意事项

- Debug模式会增加额外的UI渲染开销，仅在开发阶段使用
- Helper创建在调用 `setLightHelpersEnabled(true)` 时才执行
- Buffer可视化会改变最终输出，仅用于调试，不影响模型渲染
- 性能监控的准确性取决于浏览器的WebGL扩展支持
