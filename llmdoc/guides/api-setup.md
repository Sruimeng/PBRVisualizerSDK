# API 初始化配置指南

## 1. SDK安装和导入

```typescript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import * as THREE from 'three';
```

## 2. 容器配置

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('viewer'),
    models: [{ id: 'model', source: 'model.glb' }]
});
```

## 3. 基础配置

```typescript
const visualizer = new PBRVisualizer({
    container: document.getElementById('viewer'),
    models: [{ id: 'model', source: 'model.glb' }],
    initialGlobalState: {
        environment: { url: 'hdr.hdr', intensity: 1.0 },
        camera: {
            position: new THREE.Vector3(3, 2, 5),
            target: new THREE.Vector3(0, 0, 0),
            fov: 40
        }
    }
});
```

## 4. 初始化过程

```typescript
await visualizer.initialize();
console.log('PBR Visualizer 初始化完成');
```

## 5. 事件监听

```typescript
visualizer.on('modelLoaded', (event) => {
    console.log('模型加载:', event.modelId);
});

visualizer.on('error', (error) => {
    console.error('错误:', error.type, error.message);
});

visualizer.on('performance', (stats) => {
    console.log('性能:', stats.fps);
});
```