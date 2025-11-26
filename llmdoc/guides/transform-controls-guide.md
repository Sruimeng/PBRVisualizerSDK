# TransformControls系统使用指南

## 1. 概述

TransformControls系统是PBR Visualizer SDK中的交互控制系统，允许用户直观地操作3D模型的位置、旋转和缩放。这个系统用于：

- 提供直观的3D模型编辑体验
- 支持平移、旋转、缩放三种操作模式
- 自动与OrbitControls协调，避免交互冲突
- 实时更新模型状态，支持撤销/重做

## 2. 工作原理

### 核心机制

TransformControls系统通过以下步骤工作：

1. **控制器创建**: 为模型创建Three.js TransformControls实例
2. **模式管理**: 支持切换translate(平移)、rotate(旋转)、scale(缩放)三种模式
3. **交互协调**: 拖动控制器时自动禁用OrbitControls，防止冲突
4. **状态同步**: 每次变换后自动更新模型的transform状态
5. **撤销支持**: 变换操作自动生成事务，支持撤销/重做

### 交互流程

```
用户拖动控制器轴
         ↓
TransformControls捕获
         ↓
禁用OrbitControls
         ↓
更新模型变换
         ↓
自动更新ModelState
         ↓
生成事务记录
         ↓
恢复OrbitControls
```

## 3. 基础配置

### 启用TransformControls

```typescript
// 简单启用：使用默认配置（旋转模式）
visualizer.setModelTransformControls('model1', {
    enabled: true
});

// 完整配置：平移模式
visualizer.setModelTransformControls('model1', {
    enabled: true,
    mode: 'translate',     // 'translate', 'rotate', 'scale'
    size: 1.0,            // 控制器大小
    showX: true,          // 显示X轴
    showY: true,          // 显示Y轴
    showZ: true           // 显示Z轴
});

// 完整配置：旋转模式
visualizer.setModelTransformControls('model1', {
    enabled: true,
    mode: 'rotate',
    size: 1.0,
    showX: true,
    showY: true,
    showZ: true
});

// 完整配置：缩放模式
visualizer.setModelTransformControls('model1', {
    enabled: true,
    mode: 'scale',
    size: 1.0,
    showX: true,
    showY: true,
    showZ: true
});
```

### 禁用TransformControls

```typescript
visualizer.setModelTransformControls('model1', { enabled: false });
```

## 4. 模式切换

### 动态切换模式

```typescript
// 切换到平移模式
visualizer.setTransformControlsMode('model1', 'translate');

// 切换到旋转模式
visualizer.setTransformControlsMode('model1', 'rotate');

// 切换到缩放模式
visualizer.setTransformControlsMode('model1', 'scale');
```

### 带UI按钮的模式切换

```typescript
// 创建模式切换按钮
const buttons = {
    translate: document.getElementById('btn-translate'),
    rotate: document.getElementById('btn-rotate'),
    scale: document.getElementById('btn-scale')
};

buttons.translate.addEventListener('click', () => {
    visualizer.setTransformControlsMode('model1', 'translate');
    updateButtonStates('translate');
});

buttons.rotate.addEventListener('click', () => {
    visualizer.setTransformControlsMode('model1', 'rotate');
    updateButtonStates('rotate');
});

buttons.scale.addEventListener('click', () => {
    visualizer.setTransformControlsMode('model1', 'scale');
    updateButtonStates('scale');
});

function updateButtonStates(activeMode) {
    Object.entries(buttons).forEach(([mode, btn]) => {
        btn.classList.toggle('active', mode === activeMode);
    });
}
```

## 5. 参数说明

| 参数      | 默认值     | 说明                             |
| --------- | ---------- | -------------------------------- |
| `enabled` | `false`    | 是否启用TransformControls        |
| `mode`    | `'rotate'` | 操作模式：translate/rotate/scale |
| `size`    | `1.0`      | 控制器大小缩放因子               |
| `showX`   | `true`     | 是否显示X轴（红色）              |
| `showY`   | `true`     | 是否显示Y轴（绿色）              |
| `showZ`   | `true`     | 是否显示Z轴（蓝色）              |

## 6. 常见使用场景

### 场景1：产品编辑

```typescript
// 允许用户旋转和放置产品
visualizer.setModelTransformControls('product', {
    enabled: true,
    mode: 'rotate',
    size: 1.0,
    showX: true,
    showY: true,
    showZ: true
});

// 然后用户可以通过按钮切换到平移或缩放
```

### 场景2：受限的轴向编辑

```typescript
// 仅允许在X-Z平面上平移（不改变高度）
visualizer.setModelTransformControls('product', {
    enabled: true,
    mode: 'translate',
    showX: true,      // 允许X轴
    showY: false,     // 禁用Y轴（高度）
    showZ: true       // 允许Z轴
});
```

### 场景3：精密缩放

```typescript
// 用于精确调整模型大小
visualizer.setModelTransformControls('model', {
    enabled: true,
    mode: 'scale',
    size: 0.8,        // 较小的控制器便于精细操作
    showX: true,
    showY: true,
    showZ: true
});
```

### 场景4：多模型场景编排

```typescript
// 为每个模型配置变换控制
const models = ['model1', 'model2', 'model3'];

models.forEach(modelId => {
    visualizer.setModelTransformControls(modelId, {
        enabled: true,
        mode: 'translate',  // 初始允许平移
        size: 1.0
    });
});

// 用户选择模型时，将其设为活动的
function selectModel(modelId) {
    visualizer.setActiveTransformControls(modelId);
}
```

## 7. 轴向控制

### 选择性显示轴向

```typescript
// 只显示X和Z轴（水平编辑）
visualizer.setModelTransformControls('model1', {
    showX: true,
    showY: false,
    showZ: true
});

// 只显示Y轴（垂直编辑）
visualizer.setModelTransformControls('model1', {
    showX: false,
    showY: true,
    showZ: false
});

// 隐藏所有轴（禁用编辑）
visualizer.setModelTransformControls('model1', {
    showX: false,
    showY: false,
    showZ: false
});
```

### 快捷方式

```typescript
// 禁用垂直编辑（保持模型在平面上）
function restrictToPlane(modelId) {
    visualizer.setModelTransformControls(modelId, {
        showX: true,
        showY: false,
        showZ: true
    });
}

// 仅允许旋转
function rotateOnly(modelId) {
    visualizer.setTransformControlsMode(modelId, 'rotate');
    visualizer.setModelTransformControls(modelId, {
        showX: true,
        showY: true,
        showZ: true
    });
}
```

## 8. 活动控制器管理

### 单一活动控制器

```typescript
// 同时只能有一个模型被编辑
function switchToModel(modelId) {
    // 清除之前的活动控制器
    visualizer.setActiveTransformControls(null);

    // 设置新的活动控制器
    visualizer.setActiveTransformControls(modelId);
}

// 在模型列表中选择
const modelList = document.getElementById('model-list');
modelList.addEventListener('click', (e) => {
    const selectedModelId = e.target.dataset.modelId;
    switchToModel(selectedModelId);
});
```

### 禁用所有控制器

```typescript
visualizer.setActiveTransformControls(null);
```

## 9. 多模型配置

### 批量配置

```typescript
// 为多个模型应用相同的TransformControls配置
const transformConfig = {
    enabled: true,
    mode: 'rotate',
    size: 1.0,
    showX: true,
    showY: true,
    showZ: true
};

await visualizer.batchUpdate([
    { modelId: 'model1', config: { transformControls: transformConfig } },
    { modelId: 'model2', config: { transformControls: transformConfig } },
    { modelId: 'model3', config: { transformControls: transformConfig } }
]);
```

### 独立配置

```typescript
// 每个模型有不同的变换约束
await visualizer.updateModel('model1', {
    transformControls: {
        enabled: true,
        mode: 'translate',
        showX: true,
        showY: true,
        showZ: true
    }
});

await visualizer.updateModel('model2', {
    transformControls: {
        enabled: true,
        mode: 'rotate',
        showX: true,
        showY: true,
        showZ: true
    }
});

await visualizer.updateModel('model3', {
    transformControls: {
        enabled: true,
        mode: 'scale',
        showX: true,
        showY: true,
        showZ: true
    }
});
```

## 10. 与其他系统集成

### 与状态管理的集成

```typescript
// 监听模型变换
visualizer.on('stateChanged', (event) => {
    if (event.modelId === 'model1' && event.changes.transform) {
        console.log('模型变换:', event.changes.transform);
        updateUI(event.changes.transform);
    }
});

function updateUI(transform) {
    // 更新显示模型的位置、旋转、缩放信息
    document.getElementById('position').textContent =
        `Position: ${transform.position.x.toFixed(2)}, ${transform.position.y.toFixed(2)}, ${transform.position.z.toFixed(2)}`;

    document.getElementById('rotation').textContent =
        `Rotation: ${(transform.rotation.x * 180 / Math.PI).toFixed(1)}°, ${(transform.rotation.y * 180 / Math.PI).toFixed(1)}°`;

    document.getElementById('scale').textContent =
        `Scale: ${transform.scale.x.toFixed(2)}, ${transform.scale.y.toFixed(2)}, ${transform.scale.z.toFixed(2)}`;
}
```

### 撤销/重做支持

```typescript
// 变换操作自动生成事务，支持撤销/重做
visualizer.setTransformControlsMode('model1', 'rotate');

// 用户拖动后，可以撤销
document.getElementById('btn-undo').addEventListener('click', () => {
    visualizer.undo();
});

document.getElementById('btn-redo').addEventListener('click', () => {
    visualizer.redo();
});

// 监听撤销/重做事件
visualizer.on('undo', (event) => {
    console.log('撤销了:', event.description);
});

visualizer.on('redo', (event) => {
    console.log('重做了:', event.description);
});
```

### 与暗角系统的组合

```typescript
// 在同一个模型上使用暗角和变换控制
await visualizer.updateModel('model1', {
    vignette: {
        enabled: true,
        radiusScale: 1.5,
        color1: '#0f0c29',
        color2: '#4a6fa5'
    },
    transformControls: {
        enabled: true,
        mode: 'rotate',
        size: 1.0
    }
});
```

## 11. 大小调整

### 控制器尺寸缩放

```typescript
// 大的控制器便于操作
visualizer.setModelTransformControls('model1', {
    size: 1.5    // 1.5倍大小
});

// 小的控制器用于精细操作
visualizer.setModelTransformControls('model1', {
    size: 0.5    // 0.5倍大小
});

// 响应用户滑块
document.getElementById('size-slider').addEventListener('input', (e) => {
    const size = parseFloat(e.target.value);
    visualizer.setModelTransformControls('model1', { size });
});
```

## 12. 最佳实践

### 交互设计

1. **明确的模式指示**: 始终在UI中显示当前的变换模式
2. **快捷方式**: 提供键盘快捷键快速切换模式
3. **视觉反馈**: 在用户拖动时提供清晰的反馈
4. **撤销提示**: 在变换后提示用户可以撤销

### 性能优化

1. **单一活动控制器**: 一次只管理一个活动的变换控制器
2. **批量配置**: 使用`batchUpdate()`同时配置多个模型
3. **延迟启用**: 不要对所有模型都启用控制器，只为需要的模型启用

### 用户体验

```typescript
// 完整的交互界面示例
class TransformUI {
    constructor(visualizer, modelId) {
        this.visualizer = visualizer;
        this.modelId = modelId;
        this.setupUI();
    }

    setupUI() {
        // 模式按钮
        document.getElementById('btn-translate').addEventListener('click', () => {
            this.setMode('translate');
        });
        document.getElementById('btn-rotate').addEventListener('click', () => {
            this.setMode('rotate');
        });
        document.getElementById('btn-scale').addEventListener('click', () => {
            this.setMode('scale');
        });

        // 撤销/重做
        document.getElementById('btn-undo').addEventListener('click', () => {
            this.visualizer.undo();
        });
        document.getElementById('btn-redo').addEventListener('click', () => {
            this.visualizer.redo();
        });

        // 大小调整
        document.getElementById('size-slider').addEventListener('input', (e) => {
            const size = parseFloat(e.target.value);
            this.visualizer.setModelTransformControls(this.modelId, { size });
        });

        // 监听状态变化
        this.visualizer.on('stateChanged', (event) => {
            if (event.modelId === this.modelId) {
                this.updateDisplay(event.changes);
            }
        });
    }

    setMode(mode) {
        this.visualizer.setTransformControlsMode(this.modelId, mode);
        this.updateModeButtons(mode);
    }

    updateModeButtons(activeMode) {
        ['translate', 'rotate', 'scale'].forEach(mode => {
            const btn = document.getElementById(`btn-${mode}`);
            btn.classList.toggle('active', mode === activeMode);
        });
    }

    updateDisplay(changes) {
        if (changes.transform) {
            const transform = changes.transform;
            console.log('位置:', transform.position);
            console.log('旋转:', transform.rotation);
            console.log('缩放:', transform.scale);
        }
    }
}

// 使用
const ui = new TransformUI(visualizer, 'model1');
visualizer.setModelTransformControls('model1', { enabled: true });
```

## 13. 故障排查

### 问题1：控制器不显示

```typescript
// 检查是否启用
const state = visualizer.getCurrentState();
console.log(state.models['model1'].transformControls);

// 确保已启用
visualizer.setModelTransformControls('model1', { enabled: true });

// 设置为活动
visualizer.setActiveTransformControls('model1');
```

### 问题2：控制器与相机冲突

```typescript
// 变换控制器会自动协调OrbitControls
// 如果仍有冲突，可以禁用相机控制
visualizer.updateControls({ enabled: false });

// 完成编辑后重新启用
visualizer.updateControls({ enabled: true });
```

### 问题3：轴向显示不正确

```typescript
// 确认轴向设置
visualizer.setModelTransformControls('model1', {
    showX: true,
    showY: true,
    showZ: true
});

// 如果某个轴显示不对，检查模型的旋转是否正确
const transform = visualizer.getCurrentState().models['model1'].transform;
console.log('模型旋转:', transform.rotation);
```

TransformControls系统为3D模型编辑提供了强大而灵活的工具，通过合理的配置和使用，可以创建直观高效的交互体验。
