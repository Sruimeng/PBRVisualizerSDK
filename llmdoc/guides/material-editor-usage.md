# 材质编辑器使用指南

## 概述

材质编辑器是PBR Visualizer SDK提供的专业级材质编辑工具，采用模块化TypeScript架构，提供完整的PBR材质参数实时调节和预览功能。本指南将详细介绍如何使用新的模块化材质编辑器创建和编辑各种PBR材质。

## 快速开始

### 1. 导入材质编辑器

```typescript
import { MaterialEditor } from './src/demo/sdk-simple';

// 创建材质编辑器实例
const editor = new MaterialEditor();
```

### 2. 独立初始化

材质编辑器现已完全独立，支持自动初始化：

```typescript
// 材质编辑器会在构造函数中自动初始化
// 无需手动调用initialize()方法
const editor = new MaterialEditor();
```

### 3. 基本操作

材质编辑器提供模块化的参数控制：

- **颜色控制**: 通过HTML input元素控制材质颜色
- **滑块控制**: 金属度、粗糙度、环境贴图强度的实时调节
- **预设应用**: 6种内置预设的快速应用
- **错误处理**: 完善的错误处理和调试信息

## 材质参数详解

### 基础参数

#### 颜色 (Color)

- **用途**: 控制材质的基础颜色
- **范围**: RGB颜色值
- **影响**: 决定材质的基础反射和吸收特性

```typescript
// 设置基础颜色
editor.updateMaterial({
    color: '#ff6b6b'  // 红色
});
```

#### 金属度 (Metalness)

- **范围**: 0-1
- **0**: 完全非金属（塑料、织物等）
- **1**: 完全金属（金属材质）
- **中间值**: 金属-非金属混合材质

```typescript
// 金属材质
editor.updateMaterial({
    metalness: 1.0
});

// 塑料材质
editor.updateMaterial({
    metalness: 0.0
});
```

#### 粗糙度 (Roughness)

- **范围**: 0-1
- **0**: 完全光滑（镜面反射）
- **1**: 完全粗糙（漫反射）
- **影响**: 控制反射的模糊程度

```typescript
// 光滑材质（如金属）
editor.updateMaterial({
    roughness: 0.1
});

// 粗糙材质（如织物）
editor.updateMaterial({
    roughness: 0.9
});
```

#### 环境贴图强度 (Env Map Intensity)

- **范围**: 0-2
- **用途**: 控制环境反射的强度
- **影响**: 材质对环境的反射程度

```typescript
editor.updateMaterial({
    envMapIntensity: 1.2  // 增强环境反射
});
```

### 高级参数

#### 清漆层 (Clearcoat)

- **范围**: 0-1
- **用途**: 模拟清漆涂层效果
- **应用**: 汽车漆面、高光塑料

```typescript
// 清漆效果
editor.updateMaterial({
    clearcoat: 0.8,      // 清漆强度
    clearcoatRoughness: 0.1  // 清漆粗糙度
});
```

#### 透射率 (Transmission)

- **范围**: 0-1
- **用途**: 控制材质的透光性
- **应用**: 玻璃、透明塑料

```typescript
// 玻璃材质
editor.updateMaterial({
    transmission: 0.9,   // 高透射
    thickness: 0.5,     // 厚度
    ior: 1.5           // 折射率
});
```

## 材质预设系统

### 内置预设

材质编辑器提供6种预设材质，支持快速应用：

```typescript
// 全局函数（已绑定到window对象）
applyPreset('metal');      // 金属
applyPreset('plastic');    // 塑料
applyPreset('wood');       // 木材
applyPreset('glass');      // 玻璃
applyPreset('fabric');     // 织物
applyPreset('ceramic');    // 陶瓷
```

### 预设配置详情

```typescript
// 预设配置定义
const MATERIAL_PRESETS = {
  metal: {
    color: '#cccccc',
    metalness: 1.0,
    roughness: 0.2,
    envMapIntensity: 1.5,
  },
  plastic: {
    color: '#4a90e2',
    metalness: 0.0,
    roughness: 0.5,
    envMapIntensity: 0.8,
  },
  glass: {
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.0,
    envMapIntensity: 1.0,
  },
  wood: {
    color: '#8b4513',
    metalness: 0.0,
    roughness: 0.8,
    envMapIntensity: 0.6,
  },
  ceramic: {
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.1,
    envMapIntensity: 1.2,
  },
  fabric: {
    color: '#9b59b6',
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.4,
  },
};
```

## API接口

### MaterialEditor类

#### 构造函数

```typescript
constructor()
// 自动初始化材质编辑器
```

#### 更新材质参数

```typescript
private updateMaterial(params: MaterialParams): Promise<void>
// MaterialParams类型定义：
interface MaterialParams {
  color?: string | Color;
  metalness?: number;
  roughness?: number;
  envMapIntensity?: number;
}
```

#### 预设应用

```typescript
public applyPreset(presetName: string): Promise<void>
// 应用预设并同步UI
```

#### 重置材质

```typescript
public resetMaterial(): Promise<void>
// 重置到默认材质状态
```

#### 随机材质

```typescript
public randomizeMaterial(): Promise<void>
// 生成随机材质参数
```

#### Debug功能方法

```typescript
public toggleDebug(): void
// 一键切换Debug模式，自动更新UI按钮状态

public toggleLightHelpers(): void
// 智能切换灯光Helper显示，自动启用Debug模式

public cycleBufferMode(): void
// 循环切换SSAO Buffer可视化模式，支持中文显示

public getVisualizer(): PBRVisualizer | null
// 获取底层visualizer实例
```

### 全局函数（已绑定到window对象）

```typescript
// 材质编辑全局函数
window.applyPreset('metal');        // 应用材质预设
window.resetMaterial();             // 重置材质
window.randomizeMaterial();         // 随机材质

// Debug功能全局函数
window.toggleDebugMode();           // 切换Debug模式
window.toggleLightHelpers();        // 切换灯光Helper
window.cycleBufferMode();           // 循环Buffer模式
```

## 性能优化

### 自动质量调节

材质编辑器支持根据设备性能自动调整渲染质量：

```typescript
// 获取当前性能状态
const performance = editor.visualizer.getPerformanceStats();
console.log(`FPS: ${performance.fps}, Draw Calls: ${performance.drawCalls}`);
```

### 材质优化建议

1. **低端设备**:

   - 使用低质量材质预设
   - 减少后处理效果
   - 降低环境贴图分辨率

2. **高端设备**:
   - 启用所有高级材质特性
   - 使用高质量HDR环境
   - 启用完整后处理效果

## 实用功能

### 材质配置导出

```typescript
// 通过visualizer获取材质配置
const materialConfig = editor.visualizer.getModelState('demo_sphere');
console.log(materialConfig);

// 导出为JSON文件
function exportToJSON(config: any, filename: string) {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    // 创建下载链接...
}
```

### 错误处理

材质编辑器包含完善的错误处理：

```typescript
try {
    await editor.applyPreset('metal');
} catch (error) {
    console.error('材质预设应用失败:', error);
    // 错误信息会自动显示在控制台
}
```

### 调试信息

材质编辑器提供详细的调试信息：

```typescript
// 控制台输出示例
[MaterialEditor] Updating material for model: demo_sphere
[MaterialEditor] { color: '#cccccc', metalness: 1.0, roughness: 0.2 }
[MaterialEditor] Material update completed successfully
```

## HTML集成示例

### 基础HTML结构

```html
<div id="app">
    <!-- 材质编辑器控件 -->
    <div class="material-editor">
        <div class="control-group">
            <label for="color">颜色:</label>
            <input type="color" id="color" value="#ffffff">
        </div>

        <div class="control-group">
            <label for="metalness">金属度:</label>
            <input type="range" id="metalness" min="0" max="1" step="0.01" value="0.5">
            <span id="metalness-value">0.50</span>
        </div>

        <div class="control-group">
            <label for="roughness">粗糙度:</label>
            <input type="range" id="roughness" min="0" max="1" step="0.01" value="0.5">
            <span id="roughness-value">0.50</span>
        </div>

        <div class="control-group">
            <label for="envMapIntensity">环境强度:</label>
            <input type="range" id="envMapIntensity" min="0" max="2" step="0.01" value="1.0">
            <span id="envMapIntensity-value">1.00</span>
        </div>

        <div class="preset-buttons">
            <button onclick="applyPreset('metal')">金属</button>
            <button onclick="applyPreset('plastic')">塑料</button>
            <button onclick="applyPreset('wood')">木材</button>
            <button onclick="applyPreset('glass')">玻璃</button>
            <button onclick="applyPreset('ceramic')">陶瓷</button>
            <button onclick="applyPreset('fabric')">织物</button>
        </div>

        <div class="action-buttons">
            <button onclick="resetMaterial()">重置</button>
            <button onclick="randomizeMaterial()">随机</button>
        </div>
    </div>
</div>
```

### 初始化脚本

```typescript
// 自动初始化
const editor = new MaterialEditor();
```

## 常见问题

### Q: 材质调节没有反应？

A: 确保HTML控件ID正确，检查控制台错误信息。材质编辑器会自动处理参数转换和验证。

### Q: 性能太低怎么办？

A: 切换到低质量模式，关闭部分后处理效果，或降低环境贴图分辨率。检查控制台性能统计信息。

### Q: 如何保存自定义材质？

A: 通过visualizer.getModelState()获取当前材质配置，然后导出为JSON文件。

### Q: 材质预设不够用？

A: 可以在sdk-simple.ts中扩展MATERIAL_PRESETS对象，添加自定义预设。

## 最佳实践

1. **材质创作流程**:

   - 从相似的预设开始
   - 逐步调整参数
   - 实时观察效果
   - 导出配置保存

2. **性能管理**:

   - 定期检查性能指标
   - 根据设备性能调整设置
   - 合理使用高级材质特性

3. **代码组织**:

   - 利用模块化设计
   - 使用TypeScript类型检查
   - 遵循错误处理最佳实践

4. **调试技巧**:
   - 查看控制台调试信息
   - 使用材质预设进行快速测试
   - 利用性能监控工具

## Debug功能集成

材质编辑器内置了完整的Debug功能支持，提供简化的调试API：

### 一键式Debug控制

```typescript
// 材质编辑器实例
const editor = new MaterialEditor();

// 一键启用/禁用Debug模式
editor.toggleDebug();
// 自动更新UI按钮状态：
// 🔧 开启调试 ↔ 🔧 关闭调试
```

### 智能灯光Helper控制

```typescript
// 智能切换灯光Helper显示
// 自动检查Debug状态，未启用时先启用Debug
editor.toggleLightHelpers();

// 等价于标准Debug API的简化版本
const debugState = visualizer.debug.getState();
if (!debugState.enabled) {
    visualizer.debug.enable();
}
visualizer.debug.setLightHelpersEnabled(!debugState.activeLightHelpers.length);
```

### Buffer模式快速切换

```typescript
// 循环切换5种SSAO Buffer模式
editor.cycleBufferMode();
// 支持中文模式名称：
// 默认 → SSAO → 模糊 → 深度 → 法线 → 默认

// 自动更新按钮文本显示当前模式
// 🖼️ 默认 → 🖼️ SSAO → 🖼️ 模糊 → 🖼️ 深度 → 🖼️ 法线
```

### HTML集成示例

```html
<!-- 完整的材质编辑器 + Debug控制面板 -->
<div class="material-editor-container">
    <!-- 材质控制区域 -->
    <div class="material-controls">
        <div class="control-group">
            <label for="color">颜色:</label>
            <input type="color" id="color" value="#ffffff">
        </div>

        <div class="control-group">
            <label for="metalness">金属度:</label>
            <input type="range" id="metalness" min="0" max="1" step="0.01" value="0.5">
            <span id="metalness-value">0.50</span>
        </div>

        <!-- 更多材质控件... -->

        <div class="preset-buttons">
            <button onclick="applyPreset('metal')">金属</button>
            <button onclick="applyPreset('plastic')">塑料</button>
            <button onclick="applyPreset('glass')">玻璃</button>
        </div>
    </div>

    <!-- Debug控制区域 -->
    <div class="debug-controls">
        <h3>🔧 调试工具</h3>

        <button id="debug-toggle-btn" onclick="toggleDebugMode()">
            🔧 开启调试
        </button>

        <button id="light-helper-btn" onclick="toggleLightHelpers()">
            💡 显示灯光
        </button>

        <button id="buffer-mode-btn" onclick="cycleBufferMode()">
            🖼️ 默认
        </button>
    </div>
</div>
```

### MaterialEditor Debug特性

- **智能状态管理**: 自动检查并管理Debug系统状态
- **UI同步**: 实时更新按钮文本、样式和激活状态
- **中文界面**: Buffer模式使用中文名称，更友好
- **全局绑定**: 所有Debug方法自动绑定到window对象
- **错误处理**: 完善的错误检查和调试信息输出

### 使用场景

```typescript
// 1. 快速灯光调试
editor.toggleLightHelpers();  // 显示灯光Helper，调整灯光位置

// 2. 材质效果对比
editor.applyPreset('metal');  // 应用金属材质
editor.cycleBufferMode();     // 查看SSAO效果

// 3. 性能分析
editor.toggleDebug();         // 启用性能监控面板

// 4. 渲染问题诊断
editor.cycleBufferMode();     // 逐个检查渲染Pass结果
```

材质编辑器通过模块化TypeScript架构、完整的类型安全、完善的错误处理和集成的Debug功能，为产品可视化提供了专业级的材质编辑和调试能力。
