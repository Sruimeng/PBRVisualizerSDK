# PBR Visualizer 基础使用

## 1. 模型管理

```typescript
// 加载模型
await visualizer.loadModel('model_id', 'path/to/model.glb');

// 更新材质
await visualizer.updateModel('model_id', {
    material: { color: '#ff0000', roughness: 0.5 }
});

// 批量更新
await visualizer.batchUpdate([
    { modelId: 'model1', state: { material: { color: '#ff0000' } } },
    { modelId: 'model2', state: { material: { color: '#00ff00' } } }
]);
```

## 2. 环境配置

```typescript
// HDR环境
await visualizer.updateEnvironment({
    type: 'hdr',
    url: 'environment.hdr',
    intensity: 1.0
});

// Studio灯光
await visualizer.updateEnvironment({
    type: 'studio',
    intensity: 1.0,
    studio: {
        keyLight: { color: 0xffffff, intensity: 3.0, position: new THREE.Vector3(3, 4, 3) },
        rimLight: { color: 0x4c8bf5, intensity: 5.0, position: new THREE.Vector3(-3, 2, -4) },
        fillLight: { color: 0xffeedd, intensity: 1.5, position: new THREE.Vector3(-4, 0, 4) }
    }
});
```

## 3. 后处理

```typescript
// Bloom效果
visualizer.updatePostProcessing({
    bloom: { enabled: true, strength: 0.5 }
});

// 抗锯齿
visualizer.updatePostProcessing({
    antialiasing: { type: 'fxaa', enabled: true }
});
```

## 4. 相机控制

```typescript
// 设置相机
visualizer.setCamera([5, 3, 8], [0, 1, 0]);

// 重置相机
visualizer.resetCamera();

// 控制器设置
visualizer.updateControls({
    enabled: true,
    autoRotate: true,
    autoRotateSpeed: 1.0
});
```

## 5. 工具功能

```typescript
// 截图
const screenshot = visualizer.captureFrame();

// 分享链接
const shareUrl = await visualizer.shareState();

// 性能监控
const stats = visualizer.getPerformanceStats();

// 撤销/重做
await visualizer.undo();
await visualizer.redo();
```
