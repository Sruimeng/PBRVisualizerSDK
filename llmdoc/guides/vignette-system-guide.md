# 暗角系统使用指南

## 1. 概述

暗角系统是PBR Visualizer SDK中一个强大的背景效果系统，可以为模型创建可配置的暗角背景球体。这个系统用于：

- 创建专业级的产品展示背景
- 增强模型的视觉对比度
- 提供高度可定制的背景效果
- 支持多模型独立配置

## 2. 工作原理

### 核心机制

暗角系统通过以下步骤工作：

1. **包围盒计算**: 加载模型后，系统自动计算模型的包围盒
2. **球体创建**: 基于包围盒大小和`radiusScale`参数创建IBLSphere着色器的BackSide球体
3. **位置追踪**: 球体位置在每帧渲染循环中更新，跟随模型中心
4. **相机同步**: 相机位置uniform在每帧更新，确保视觉效果正确
5. **参数应用**: 配置的颜色、平滑度、亮度等参数应用到球体着色器

### 性能特性

- **高效渲染**: BackSide球体只需单个DrawCall
- **动态更新**: 参数变更在下一帧立即生效
- **内存优化**: 球体纹理和材质复用，减少GPU内存占用
- **实时响应**: 支持运行时配置更新，无需重新加载

## 3. 基础配置

### 启用暗角

```typescript
// 简单启用：使用默认配置
visualizer.setModelVignette('model1', {
    enabled: true
});

// 完整配置：自定义所有参数
visualizer.setModelVignette('model1', {
    enabled: true,
    radiusScale: 1.5,          // 球体半径倍数
    smoothness: 0.15,          // 边缘平滑度
    ringRadius: 0.75,          // 环半径
    noiseIntensity: 0.08,      // 噪声强度
    color1: '#0f0c29',         // 暗色
    color2: '#4a6fa5',         // 亮色
    vignetteRange: 0.85,       // 暗角范围
    brightness: 0.10           // 亮度补偿
});
```

### 禁用暗角

```typescript
visualizer.setModelVignette('model1', { enabled: false });
```

## 4. 参数说明

| 参数             | 默认值    | 范围      | 说明                             |
| ---------------- | --------- | --------- | -------------------------------- |
| `enabled`        | `false`   | -         | 是否启用暗角                     |
| `radiusScale`    | `1.5`     | `0.5-3.0` | 球体半径倍数（相对于模型包围盒） |
| `smoothness`     | `0.15`    | `0.0-1.0` | 边缘渐变平滑度，越大越柔和       |
| `ringRadius`     | `0.75`    | `0.0-1.0` | 暗角环半径比例                   |
| `noiseIntensity` | `0.08`    | `0.0-0.5` | 噪声强度，增加视觉细节           |
| `color1`         | `#0f0c29` | -         | 暗处颜色（球体内层）             |
| `color2`         | `#4a6fa5` | -         | 亮处颜色（球体外层）             |
| `vignetteRange`  | `0.85`    | `0.0-1.0` | 暗角范围，越小暗角越明显         |
| `brightness`     | `0.10`    | `0.0-1.0` | 亮度补偿，提亮整体背景           |

## 5. 常见使用场景

### 场景1：专业产品展示

```typescript
// 深蓝色渐变背景，适合高端产品
visualizer.setModelVignette('product', {
    enabled: true,
    radiusScale: 1.8,
    smoothness: 0.2,
    color1: '#0a0a1a',         // 深蓝黑
    color2: '#2a4a7a',         // 蓝色
    vignetteRange: 0.8,        // 强暗角
    brightness: 0.08
});
```

### 场景2：珠宝和精细产品

```typescript
// 温暖的金色渐变，强调细节
visualizer.setModelVignette('jewelry', {
    enabled: true,
    radiusScale: 1.5,
    smoothness: 0.25,          // 更柔和
    noiseIntensity: 0.05,      // 细微噪声
    color1: '#1a1510',         // 深棕
    color2: '#6a5a3a',         // 金棕色
    vignetteRange: 0.9,        // 弱暗角
    brightness: 0.15           // 提亮
});
```

### 场景3：科技产品

```typescript
// 现代深色主题，高对比度
visualizer.setModelVignette('tech', {
    enabled: true,
    radiusScale: 1.6,
    smoothness: 0.1,           // 锐利边缘
    color1: '#0f0f1f',
    color2: '#1a3a5a',
    vignetteRange: 0.75,       // 强暗角
    brightness: 0.05
});
```

### 场景4：柔和的艺术展示

```typescript
// 淡色渐变，柔和舒适
visualizer.setModelVignette('art', {
    enabled: true,
    radiusScale: 2.0,          // 大范围
    smoothness: 0.4,           // 非常柔和
    color1: '#3a3a4a',         // 灰蓝
    color2: '#7a8a9a',         // 浅蓝灰
    vignetteRange: 0.95,       // 极弱暗角
    brightness: 0.25           // 提亮
});
```

## 6. 动态配置

### 渐进式配置

```typescript
// 先启用基础功能
visualizer.setModelVignette('model1', { enabled: true });

// 然后逐步优化参数
visualizer.setModelVignette('model1', {
    radiusScale: 1.8
});

visualizer.setModelVignette('model1', {
    smoothness: 0.2,
    color1: '#0a0a2a'
});
```

### 响应用户交互

```typescript
// UI按钮切换暗角强度
function setVignetteIntensity(intensity) {
    const vignetteRange = 1.0 - intensity;  // intensity: 0-1
    const brightness = 0.05 + intensity * 0.1;

    visualizer.setModelVignette('model1', {
        vignetteRange,
        brightness
    });
}

// 用户选择配色主题
function applyVignetteTheme(theme) {
    const themes = {
        'dark': {
            color1: '#0f0c29',
            color2: '#4a6fa5'
        },
        'warm': {
            color1: '#2a1a0a',
            color2: '#8a5a2a'
        },
        'cool': {
            color1: '#0a1a3a',
            color2: '#3a5a9a'
        }
    };

    visualizer.setModelVignette('model1', themes[theme]);
}
```

## 7. 多模型配置

### 批量配置

```typescript
// 为多个模型应用相同的暗角配置
const vignetteConfig = {
    enabled: true,
    radiusScale: 1.5,
    smoothness: 0.15,
    color1: '#0f0c29',
    color2: '#4a6fa5'
};

await visualizer.batchUpdate([
    { modelId: 'model1', config: { vignette: vignetteConfig } },
    { modelId: 'model2', config: { vignette: vignetteConfig } },
    { modelId: 'model3', config: { vignette: vignetteConfig } }
]);
```

### 独立配置

```typescript
// 每个模型有独立的暗角效果
await visualizer.updateModel('model1', {
    vignette: {
        enabled: true,
        radiusScale: 1.5,
        color1: '#0f0c29',
        color2: '#4a6fa5'
    }
});

await visualizer.updateModel('model2', {
    vignette: {
        enabled: true,
        radiusScale: 1.8,
        color1: '#2a1a0a',
        color2: '#8a5a2a'
    }
});
```

## 8. 最佳实践

### 性能优化

1. **避免过度更新**: 不要在每帧都调用`setModelVignette()`
2. **批量更新**: 使用`batchUpdate()`同时配置多个模型
3. **参数预设**: 预先定义常用配置，直接应用而非计算

### 视觉效果优化

1. **平衡参数**: `smoothness`和`noiseIntensity`要配合使用
2. **颜色对比**: 选择互补的`color1`和`color2`增强对比
3. **测试不同比例**: 根据模型大小调整`radiusScale`
4. **监视亮度**: `brightness`参数对整体感受影响大

### 与其他系统协调

```typescript
// 暗角系统与材质系统的协调
await visualizer.updateModel('model1', {
    material: {
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.8
    },
    vignette: {
        enabled: true,
        radiusScale: 1.5,
        color1: '#0f0c29',
        color2: '#4a6fa5'
    }
});

// 暗角系统与灯光系统的协调
await visualizer.updateEnvironment({
    type: 'studio',
    intensity: 1.0,
    studio: {
        keyLight: { color: 0xffffff, intensity: 3.0 },
        rimLight: { color: 0x4c8bf5, intensity: 2.0 },
        fillLight: { color: 0xffeedd, intensity: 1.5 }
    }
});

// 在同一个updateModel调用中配置暗角
visualizer.setModelVignette('model1', {
    enabled: true,
    radiusScale: 1.5
});
```

## 9. 故障排查

### 问题1：暗角不显示

```typescript
// 检查是否启用
const state = visualizer.getCurrentState();
console.log(state.models['model1'].vignette);

// 确保已启用
visualizer.setModelVignette('model1', { enabled: true });
```

### 问题2：暗角位置偏移

```typescript
// 暗角球体会自动跟随模型位置
// 如果模型移动后暗角位置不对，调用以下方法强制更新：
visualizer.updateAllVignetteSpheres();
```

### 问题3：颜色不符合预期

```typescript
// 暗角颜色会受到HDR环境影响
// 如果配色不对，检查当前的环境设置
const globalState = visualizer.getCurrentState().global;
console.log(globalState.environment);

// 调整环境强度可能会改善暗角效果
await visualizer.updateEnvironment({
    url: globalState.environment.url,
    intensity: 0.8  // 降低环境强度
});
```

## 10. 性能监控

暗角系统的性能开销很小，但你可以监控整体渲染性能：

```typescript
// 监听性能事件
visualizer.on('performance', (stats) => {
    console.log(`FPS: ${stats.fps}`);
    console.log(`DrawCalls: ${stats.drawCalls}`);
    console.log(`FrameTime: ${stats.frameTime}ms`);
});

// 获取后处理系统的性能信息
const perfInfo = visualizer.getPostProcessSystem().getPerformanceInfo();
console.log(`后处理渲染时间: ${perfInfo.renderTime}ms`);
```

这个暗角系统通过灵活的配置和高效的渲染实现，为产品展示提供了强大的视觉效果支持。
