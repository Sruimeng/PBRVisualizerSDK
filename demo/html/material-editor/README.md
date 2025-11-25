# 材质编辑器Demo

本目录包含三个不同版本的材质编辑器演示,适合不同的使用场景。

## 📋 Demo列表

### 1. ⭐ pure.html (推荐)
**纯Three.js实现的材质编辑器**

- ✅ 无需任何依赖,直接运行
- ✅ 完整的PBR材质参数调节
- ✅ 6种预设材质(金属、塑料、玻璃、木材、陶瓷、发光)
- ✅ 实时性能监控
- ✅ 自动旋转和交互控制
- 📦 文件大小: 约20KB
- 🚀 适用场景: 快速原型、教学演示、轻量级应用

**特点**: 不依赖PBR Visualizer SDK,仅使用Three.js核心功能实现。代码简洁易懂,适合学习和快速验证材质效果。

### 2. sdk-simple.html
**基于SDK的简化材质编辑器**

- ✅ 使用PBR Visualizer SDK
- ✅ 完整的环境光照系统
- ✅ 高级后处理效果(Bloom, SSAO)
- ✅ 事务化状态管理
- ⚠️ 需要SDK已构建(dist/目录)
- 📦 文件大小: 约15KB (需SDK)
- 🚀 适用场景: 展示SDK功能、生产级应用

**特点**: 展示如何正确使用PBR Visualizer SDK的API,包括初始化、模型加载、材质更新等。适合作为SDK集成的起点。

### 3. index.html (开发中)
**专业级React材质编辑器**

- ⚠️ 需要React和Babel
- ⚠️ 需要完整的构建环境
- 🚧 当前状态: 开发中,部分API需要调整
- 🚀 适用场景: 复杂的材质编辑应用

**特点**: 使用React构建的完整材质编辑器,包含丰富的UI组件和交互功能。适合构建生产级材质编辑应用。

## 🚀 快速开始

### 方法1: 使用纯Three.js版本(推荐新手)

```bash
# 直接用浏览器打开
open demo/html/material-editor/pure.html
```

### 方法2: 使用SDK版本

```bash
# 1. 先构建SDK
pnpm build

# 2. 启动开发服务器
pnpm dev

# 3. 访问
# http://localhost:5173/html/material-editor/sdk-simple.html
```

## 📚 代码示例

### Pure Three.js版本使用示例

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 创建场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 创建材质
const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.5
});

// 创建球体
const geometry = new THREE.SphereGeometry(1, 64, 64);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 更新材质
material.metalness = 1.0;
material.roughness = 0.2;
material.needsUpdate = true;
```

### SDK版本使用示例

```javascript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import { Vector3, Color } from 'three';

// 创建PBR Visualizer实例
const visualizer = new PBRVisualizer({
    container: document.getElementById('app'),
    models: [],
    initialGlobalState: {
        environment: {
            intensity: 1.0,
            url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr'
        },
        sceneSettings: {
            background: new Color(0x1a1a1a),
            exposure: 1.0
        },
        camera: {
            position: new Vector3(2, 2, 5),
            target: new Vector3(0, 0, 0),
            fov: 50
        }
    }
});

// 初始化
await visualizer.initialize();

// 加载模型
await visualizer.loadModel('sphere', '/models/sphere.glb');

// 更新材质
await visualizer.updateModel('sphere', {
    material: {
        color: '#cccccc',
        metalness: 1.0,
        roughness: 0.2,
        envMapIntensity: 1.5
    }
});
```

## 🐛 已知问题和解决方案

### 问题1: SDK版本无法运行
**原因**: SDK未构建或路径不正确

**解决方案**:
```bash
# 重新构建SDK
pnpm clean
pnpm build

# 检查dist/index.mjs是否存在
ls -la dist/index.mjs
```

### 问题2: React版本报错
**原因**: 缺少React依赖或Babel转译

**解决方案**: 暂时使用pure.html或sdk-simple.html,React版本正在开发中

### 问题3: 模型加载失败
**原因**: 模型文件路径不正确或文件不存在

**解决方案**:
- Pure版本: 直接使用内置球体,无需模型文件
- SDK版本: 确保模型文件存在,或跳过模型加载步骤

## 📖 相关文档

- [材质编辑器使用指南](../../../llmdoc/guides/material-editor-usage.md)
- [材质和光照配置](../../../llmdoc/guides/material-and-lighting-configuration.md)
- [API使用模式](../../../llmdoc/guides/api-usage.md)
- [快速开始](../../../llmdoc/guides/quick-start.md)

## 🔍 demo文件说明

| 文件 | 说明 | 依赖 | 状态 |
|------|------|------|------|
| pure.html | 纯Three.js实现 | Three.js (CDN) | ✅ 可用 |
| sdk-simple.html | SDK简化版本 | PBR Visualizer SDK | ✅ 可用 |
| simple.html | 早期SDK版本 | PBR Visualizer SDK | ⚠️ 已废弃 |
| index.html | React专业版 | React, Babel, SDK | 🚧 开发中 |
| index.ts | TypeScript Demo类 | SDK | ⚠️ 需修复 |
| simple.js | 简化编辑器类 | Three.js | ✅ 可用 |

## 💡 开发建议

1. **学习Three.js**: 从pure.html开始,理解基础的Three.js材质系统
2. **使用SDK**: 参考sdk-simple.html,学习SDK的正确使用方式
3. **生产应用**: 基于SDK版本开发,利用完整的状态管理和后处理功能

## 🤝 贡献

如果您发现问题或有改进建议,请:
1. 查看[问题追踪](https://github.com/Sruimeng/PBRVisualizerSDK/issues)
2. 提交Pull Request
3. 联系维护者

## 📄 许可证

MIT License - 详见项目根目录的LICENSE文件