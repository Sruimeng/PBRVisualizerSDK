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
// Bloom效果
visualizer.updatePostProcessing({
    bloom: { enabled: true, strength: 0.5, threshold: 0.8 }
});

// 抗锯齿
visualizer.updatePostProcessing({
    antialiasing: { type: 'fxaa', enabled: true }
});

// SSAO
visualizer.updatePostProcessing({
    ssao: { enabled: true, intensity: 1.0 }
});
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