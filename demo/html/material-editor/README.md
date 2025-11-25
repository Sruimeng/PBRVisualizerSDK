# 材质编辑器Demo

本目录包含基于PBR Visualizer SDK的材质编辑器演示。

## 📋 Demo列表

### sdk-simple.html
**基于PBR Visualizer SDK的材质编辑器**

- ✅ 完整的PBR材质参数调节
- ✅ 6种预设材质(金属、塑料、玻璃、木材、陶瓷、发光)
- ✅ 实时性能监控
- ✅ 自动旋转和交互控制
- ✅ 集成PBR Visualizer SDK的强大功能
- 🚀 适用场景: SDK功能演示、材质编辑开发参考

**特点**: 使用PBR Visualizer SDK构建的材质编辑器,展示了SDK的核心功能和用法。代码结构清晰,适合学习SDK的使用方法。

## 🚀 快速开始

### 使用SDK版本

```bash
# 1. 先构建SDK
pnpm build

# 2. 启动开发服务器
pnpm dev

# 3. 访问
# http://localhost:8080/demo/html/material-editor/sdk-simple.html
```

## 📚 代码示例

### SDK版本使用示例

```javascript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';

// 创建PBR可视化器
const visualizer = new PBRVisualizer({
  container: '#container',
  enableStats: true,
  enableOrbit: true,
  autoRotate: true
});

// 加载模型
await visualizer.loadModel('path/to/model.glb');

// 获取材质面板
const materialPanel = visualizer.getMaterialPanel();

// 监听材质变化
materialPanel.on('materialChange', (material) => {
  console.log('材质已更新:', material);
});
```

## 🎨 材质参数说明

### 基础参数
- **color**: 基础颜色
- **metalness**: 金属度 (0-1)
- **roughness**: 粗糙度 (0-1)
- **emissive**: 自发光颜色

### 纹理参数
- **map**: 漫反射贴图
- **normalMap**: 法线贴图
- **roughnessMap**: 粗糙度贴图
- **metalnessMap**: 金属度贴图

## 🔧 自定义配置

### 环境设置
```javascript
const visualizer = new PBRVisualizer({
  environmentMap: 'path/to/hdr.hdr',
  backgroundColor: '#ffffff',
  exposure: 1.0
});
```

### 性能优化
```javascript
const visualizer = new PBRVisualizer({
  enableShadows: false,
  maxTextureSize: 1024,
  pixelRatio: Math.min(window.devicePixelRatio, 2)
});
```

## 📖 相关文档

- [PBR Visualizer SDK 完整文档](../../README.md)
- [API参考文档](../../docs/api.md)
- [更多示例](../../examples/)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个demo。

## 📄 许可证

MIT License