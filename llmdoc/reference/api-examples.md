# API使用示例参考

## 1. 基础初始化示例

```typescript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import * as THREE from 'three';

async function setupBasicVisualizer() {
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

    await visualizer.initialize();
    return visualizer;
}
```

## 2. 材质配置示例

```typescript
// 金属材质
await visualizer.updateModel('model', {
    material: {
        color: '#c0c0c0',
        roughness: 0.1,
        metalness: 0.9
    }
});

// 玻璃材质
await visualizer.updateModel('model', {
    material: {
        color: '#ffffff',
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.9,
        transparent: true,
        opacity: 0.1
    }
});

// 塑料材质
await visualizer.updateModel('model', {
    material: {
        color: '#ff0000',
        roughness: 0.3,
        metalness: 0.0
    }
});
```

## 3. 环境配置示例

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
        keyLight: {
            color: 0xffffff,
            intensity: 3.0,
            position: new THREE.Vector3(3, 4, 3)
        },
        rimLight: {
            color: 0x4c8bf5,
            intensity: 5.0,
            position: new THREE.Vector3(-3, 2, -4)
        },
        fillLight: {
            color: 0xffeedd,
            intensity: 1.5,
            position: new THREE.Vector3(-4, 0, 4)
        }
    }
});
```

## 4. 后处理效果示例

```typescript
// Bloom效果
visualizer.updatePostProcessing({
    bloom: {
        enabled: true,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.8
    }
});

// 抗锯齿
visualizer.updatePostProcessing({
    antialiasing: {
        type: 'fxaa',
        enabled: true
    }
});

// SSAO
visualizer.updatePostProcessing({
    ssao: {
        enabled: true,
        kernelRadius: 4,
        minDistance: 0.005,
        maxDistance: 0.1
    }
});
```

## 5. 相机控制示例

```typescript
// 设置相机位置和目标
visualizer.setCamera([5, 3, 8], [0, 1, 0]);

// 重置相机到初始状态
visualizer.resetCamera();

// 启用自动旋转
visualizer.updateControls({
    enabled: true,
    autoRotate: true,
    autoRotateSpeed: 2.0
});
```

## 6. 事件处理示例

```typescript
// 模型加载完成事件
visualizer.on('modelLoaded', (event) => {
    console.log('模型加载:', event.modelId);
    console.log('加载时间:', event.loadTime);
    console.log('三角形数量:', event.triangleCount);
});

// 错误处理事件
visualizer.on('error', (error) => {
    console.error('错误类型:', error.type);
    console.error('错误信息:', error.message);
    console.error('是否可恢复:', error.recoverable);
});

// 性能监控事件
visualizer.on('performance', (stats) => {
    console.log('FPS:', stats.fps);
    console.log('Draw Calls:', stats.drawCalls);
    console.log('内存使用:', stats.memoryUsage);
    console.log('三角形数量:', stats.triangles);
});
```

## 7. 完整应用示例

```typescript
async function createCompleteApp() {
    const visualizer = new PBRVisualizer({
        container: document.getElementById('viewer'),
        models: [{ id: 'model', source: 'model.glb' }],
        initialGlobalState: {
            environment: {
                url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr',
                intensity: 1.0
            },
            camera: {
                position: new THREE.Vector3(5, 3, 8),
                target: new THREE.Vector3(0, 1, 0),
                fov: 45
            },
            postProcessing: {
                enabled: true,
                bloom: { enabled: true, strength: 0.5 }
            }
        }
    });

    visualizer.on('modelLoaded', () => {
        console.log('应用启动完成');
    });

    await visualizer.initialize();
    return visualizer;
}

// 启动应用
createCompleteApp().then(visualizer => {
    console.log('PBR应用创建成功');
}).catch(error => {
    console.error('应用创建失败:', error);
});
```