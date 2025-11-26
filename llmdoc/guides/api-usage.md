# API使用模式指南

## 1. 模型管理

```typescript
// 加载模型
await visualizer.loadModel('model2', 'model2.glb');

// 更新模型材质
await visualizer.updateModel('model', {
    material: {
        color: '#c0c0c0',
        roughness: 0.3,
        metalness: 0.8
    }
});

// 更新模型变换
await visualizer.updateModel('model', {
    transform: {
        position: new THREE.Vector3(0, 1, 0),
        rotation: new THREE.Euler(0, Math.PI / 4, 0),
        scale: new THREE.Vector3(1, 1, 1)
    }
});
```

## 2. 环境配置

```typescript
// HDR环境
await visualizer.updateEnvironment({
    type: 'hdr',
    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr',
    intensity: 1.0
});

// Studio灯光
await visualizer.updateEnvironment({
    type: 'studio',
    intensity: 1.0,
    studio: {
        keyLight: { color: 0xffffff, intensity: 3.0 },
        rimLight: { color: 0x4c8bf5, intensity: 2.0 },
        fillLight: { color: 0xffeedd, intensity: 1.5 }
    }
});
```

## 3. 后处理效果

```typescript
// 完整后处理配置
visualizer.updatePostProcessing({
    enabled: true,  // 启用后处理系统（与isEnabled标志同步）
    ssao: {
        enabled: true,
        kernelRadius: 4,
        minDistance: 0.005,
        maxDistance: 0.1
    },
    bloom: {
        enabled: false,  // 默认关闭，性能考虑
        strength: 0.5,
        radius: 0.4,
        threshold: 0.8
    },
    toneMapping: {
        type: THREE.ACESFilmicToneMapping,
        exposure: 1.0,
        whitePoint: 1.0
    },
    antialiasing: {
        type: 'fxaa',
        enabled: true
    }
});

// 单独控制SSAO
visualizer.getPostProcessSystem().toggleSSAO(true);
visualizer.getPostProcessSystem().adjustSSAOStrength(1.2);

// 获取后处理性能信息
const perfInfo = visualizer.getPostProcessSystem().getPerformanceInfo();
console.log(`后处理渲染时间: ${perfInfo.renderTime}ms`);
```

## 4. 相机控制

```typescript
// 设置相机
visualizer.setCamera([5, 3, 8], [0, 1, 0]);

// 重置相机
visualizer.resetCamera();

// 自动旋转
visualizer.updateControls({
    enabled: true,
    autoRotate: true,
    autoRotateSpeed: 2.0
});
```

## 5. 暗角系统

```typescript
// 为模型配置暗角球体
visualizer.setModelVignette('model1', {
    enabled: true,
    radiusScale: 1.5,        // 球体半径比例（相对于模型包围盒）
    smoothness: 0.15,        // 边缘渐变平滑度
    ringRadius: 0.75,        // 暗角环半径
    noiseIntensity: 0.08,    // 噪声强度
    color1: '#0f0c29',       // 暗处颜色
    color2: '#4a6fa5',       // 亮处颜色
    vignetteRange: 0.85,     // 暗角范围
    brightness: 0.10         // 亮度补偿
});

// 批量配置多个模型的暗角
await visualizer.batchUpdate([
    {
        modelId: 'model1',
        config: {
            vignette: { enabled: true, radiusScale: 1.5 }
        }
    },
    {
        modelId: 'model2',
        config: {
            vignette: { enabled: true, radiusScale: 1.8, color1: '#1a1a1a' }
        }
    }
]);

// 仅更新暗角颜色
visualizer.setModelVignette('model1', {
    color1: '#2a2a4a',
    color2: '#5a8fc5'
});

// 禁用暗角
visualizer.setModelVignette('model1', { enabled: false });
```

## 6. TransformControls系统

```typescript
// 为模型启用变换控制（旋转模式）
visualizer.setModelTransformControls('model1', {
    enabled: true,
    mode: 'rotate',  // 'translate', 'rotate', 'scale'
    size: 1.0,       // 控制器大小
    showX: true,
    showY: true,
    showZ: true
});

// 切换到平移模式
visualizer.setTransformControlsMode('model1', 'translate');

// 切换到缩放模式
visualizer.setTransformControlsMode('model1', 'scale');

// 设置活动的变换控制器（同时只能有一个活动）
visualizer.setActiveTransformControls('model1');

// 批量配置多个模型的变换控制
await visualizer.batchUpdate([
    {
        modelId: 'model1',
        config: {
            transformControls: { enabled: true, mode: 'rotate' }
        }
    },
    {
        modelId: 'model2',
        config: {
            transformControls: { enabled: true, mode: 'translate' }
        }
    }
]);

// 仅显示X和Z轴（隐藏Y轴）
visualizer.setModelTransformControls('model1', {
    showX: true,
    showY: false,
    showZ: true
});

// 禁用变换控制
visualizer.setModelTransformControls('model1', { enabled: false });
```

## 7. 暗角和TransformControls组合使用

```typescript
// 创建完整的交互场景：暗角背景+变换控制
await visualizer.updateModel('model1', {
    vignette: {
        enabled: true,
        radiusScale: 1.5,
        color1: '#0f0c29',
        color2: '#4a6fa5',
        smoothness: 0.15
    },
    transformControls: {
        enabled: true,
        mode: 'rotate',
        size: 1.0
    }
});

// 动态切换交互模式
const switchToTranslate = () => {
    visualizer.setTransformControlsMode('model1', 'translate');
};

const switchToRotate = () => {
    visualizer.setTransformControlsMode('model1', 'rotate');
};

const switchToScale = () => {
    visualizer.setTransformControlsMode('model1', 'scale');
};

// 监听变换后的模型状态
visualizer.on('stateChanged', (event) => {
    if (event.modelId === 'model1' && event.changes.transform) {
        console.log('模型已变换:', event.changes.transform);
    }
});
```