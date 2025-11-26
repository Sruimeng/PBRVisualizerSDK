# PBR Visualizer SDK 初始化配置

## 1. 快速安装

```bash
npm install @sruim/pbr-visualizer-sdk
```

## 2. 基础导入

```typescript
import { PBRVisualizer, VisualizerOptions } from '@sruim/pbr-visualizer-sdk';
import * as THREE from 'three';
```

## 3. 容器配置

```typescript
// 使用现有容器
const container = document.getElementById('viewer');

// 或动态创建
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '100vh';
document.body.appendChild(container);
```

## 4. 基础配置

```typescript
const options: VisualizerOptions = {
    container: container,
    models: [
        {
            id: 'main_model',
            source: 'model.glb'
        }
    ],
    initialGlobalState: {
        environment: {
            url: 'hdr.hdr',
            intensity: 1.0
        },
        camera: {
            position: new THREE.Vector3(3, 2, 5),
            target: new THREE.Vector3(0, 0, 0),
            fov: 40
        }
    }
};
```

## 5. 创建实例

```typescript
const visualizer = new PBRVisualizer(options);
```

## 6. 初始化

```typescript
await visualizer.initialize();
```

## 7. 基础事件监听

```typescript
visualizer.on('modelLoaded', (event) => {
    console.log('模型加载完成:', event.modelId);
});

visualizer.on('error', (error) => {
    console.error('错误:', error);
});
```
