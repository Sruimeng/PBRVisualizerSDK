# PBR Visualizer 代码示例

## 1. 基础示例

```typescript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import * as THREE from 'three';

async function setup() {
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

## 2. 材质示例

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

## 3. 环境示例

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
        keyLight: { color: 0xffffff, intensity: 3.0, position: new THREE.Vector3(3, 4, 3) },
        rimLight: { color: 0x4c8bf5, intensity: 5.0, position: new THREE.Vector3(-3, 2, -4) },
        fillLight: { color: 0xffeedd, intensity: 1.5, position: new THREE.Vector3(-4, 0, 4) }
    }
});
```

## 4. 后处理示例

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
```

## 5. 相机示例

```typescript
// 设置相机位置
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

## 6. 事件示例

```typescript
// 模型加载完成
visualizer.on('modelLoaded', (event) => {
    console.log('模型加载:', event.modelId);
});

// 错误处理
visualizer.on('error', (error) => {
    console.error('错误:', error.type, error.message);
});

// 性能监控
visualizer.on('performance', (stats) => {
    console.log('FPS:', stats.fps);
});
```

## 7. 完整应用示例

```typescript
async function createApp() {
    const visualizer = new PBRVisualizer({
        container: document.getElementById('viewer'),
        models: [{ id: 'model', source: 'model.glb' }],
        initialGlobalState: {
            environment: {
                url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr',
                intensity: 1.0
            },
            camera: {
                position: new THREE.Vector5, 3, 8),
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

createApp().then(visualizer => {
    console.log('PBR应用创建成功');
});
```

## 8. 材质编辑器示例

```typescript
import { MaterialEditorDemo } from './demo/html/material-editor/sdk-simple';

// 初始化材质编辑器
const editor = new MaterialEditorDemo({
    container: document.getElementById('editor'),
    modelSource: './models/sample.glb'
});

await editor.initialize();

// 基础材质编辑
editor.updateMaterial({
    color: '#ff6b6b',
    metalness: 0.8,
    roughness: 0.2
});

// 应用材质预设
editor.applyPreset('glass');

// 监听材质变化
editor.on('materialUpdated', (params) => {
    console.log('材质参数更新:', params);
});

// 导出材质配置
const config = editor.exportMaterial();
console.log('材质配置:', config);

// 性能监控
editor.on('performanceUpdate', (stats) => {
    console.log('性能:', stats.fps, 'FPS');
});
```

## 9. 高级材质示例

```typescript
// 金属材质 + 清漆效果
await visualizer.updateModel('model', {
    material: {
        color: '#888888',
        metalness: 1.0,
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.2
    }
});

// 玻璃材质 + 透射效果
await visualizer.updateModel('model', {
    material: {
        color: '#ffffff',
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.9,
        transparent: true,
        opacity: 0.3,
        thickness: 0.5,
        ior: 1.5
    }
});

// 织物材质 + 漫反射
await visualizer.updateModel('model', {
    material: {
        color: '#444444',
        metalness: 0.0,
        roughness: 1.0,
        envMapIntensity: 0.3
    }
});

// 混合材质（金属 + 透射）
await visualizer.updateModel('model', {
    material: {
        color: '#666666',
        metalness: 0.6,
        roughness: 0.3,
        transmission: 0.4,
        transparent: true,
        opacity: 0.8,
        thickness: 0.3,
        envMapIntensity: 1.0
    }
});
```

## 10. 材质预设系统示例

```typescript
// 获取所有内置预设
const presets = visualizer.materialSystem.getPresets();
console.log('可用预设:', presets);

// 创建自定义预设
const customPreset = {
    name: '自定义材质',
    params: {
        color: '#ff6b6b',
        metalness: 0.5,
        roughness: 0.3,
        clearcoat: 0.2,
        transmission: 0.1,
        envMapIntensity: 1.0
    }
};

// 添加预设
visualizer.materialSystem.addPreset(customPreset);

// 应用预设
await visualizer.applyMaterialPreset('model', '自定义材质');

// 获取预设详情
const presetDetails = visualizer.materialSystem.getPresetDetails('金属');
console.log('金属预设详情:', presetDetails);

// 导出预设配置
const presetConfig = visualizer.materialSystem.exportPreset('自定义材质');
console.log('预设配置:', presetConfig);
```
```