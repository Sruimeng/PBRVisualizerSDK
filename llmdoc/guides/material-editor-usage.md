# 材质编辑器使用指南

## 概述

材质编辑器是PBR Visualizer SDK提供的专业级材质编辑工具，提供完整的PBR材质参数实时调节和预览功能。本指南将详细介绍如何使用材质编辑器创建和编辑各种PBR材质。

## 快速开始

### 1. 启动材质编辑器

```typescript
import { MaterialEditorDemo } from './demo/html/material-editor/sdk-simple';

// 初始化材质编辑器
const editor = new MaterialEditorDemo({
    container: document.getElementById('material-editor'),
    modelSource: './models/sample.glb'
});

await editor.initialize();
```

### 2. 基本操作

材质编辑器提供了直观的三栏布局：
- **左侧工具栏**: 工具选择和视图控制
- **右侧属性面板**: 材质参数调节
- **底部性能面板**: 实时性能监控

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

材质编辑器提供6种预设材质，点击即可快速应用：

```typescript
// 获取所有预设
const presets = editor.getPresets();

// 应用预设
editor.applyPreset('metal');      // 金属
editor.applyPreset('plastic');    // 塑料
editor.applyPreset('wood');       // 木材
editor.applyPreset('glass');      // 玻璃
editor.applyPreset('fabric');     // 织物
editor.applyPreset('ceramic');    // 陶瓷
```

### 自定义预设

```typescript
// 创建自定义预设
const customPreset = {
    name: '自定义材质',
    params: {
        color: '#ff6b6b',
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 0.2,
        transmission: 0.1
    }
};

// 添加预设
editor.addPreset(customPreset);

// 应用自定义预设
editor.applyPreset('自定义材质');
```

## 性能优化

### 自动质量调节

材质编辑器支持根据设备性能自动调整渲染质量：

```typescript
// 获取当前性能状态
const performance = editor.getPerformanceStats();
console.log(`FPS: ${performance.fps}, Draw Calls: ${performance.drawCalls}`);

// 手动调整质量
editor.setQualityLevel('high');    // 高质量
editor.setQualityLevel('medium');  // 中等质量
editor.setQualityLevel('low');     // 低质量
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

### 材质导出

```typescript
// 导出当前材质配置
const materialConfig = editor.exportMaterial();
console.log(materialConfig);

// 导出为JSON文件
exportToJSON(materialConfig, 'material-config.json');
```

### 截图功能

```typescript
// 保存当前渲染画面
editor.captureScreenshot('material-preview.png');
```

### 性能监控

```typescript
// 监听性能变化
editor.on('performanceUpdate', (stats) => {
    console.log('性能统计:', stats);
    // 可以根据性能数据动态调整渲染设置
});

// 获取详细性能信息
const detailedStats = editor.getDetailedPerformance();
console.log(detailedStats);
```

## 常见问题

### Q: 材质调节没有反应？
A: 确保已选择材质编辑工具，检查模型是否正确加载。

### Q: 性能太低怎么办？
A: 切换到低质量模式，关闭部分后处理效果，或降低环境贴图分辨率。

### Q: 如何保存自定义材质？
A: 使用导出功能保存材质配置为JSON文件。

### Q: 材质预设不够用？
A: 可以通过API添加自定义材质预设。

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

3. **材质库管理**:
   - 建立材质分类系统
   - 定期整理预设
   - 文档化材质参数

材质编辑器提供了强大的材质编辑能力，通过合理使用这些功能，可以快速创建出高质量的PBR材质。