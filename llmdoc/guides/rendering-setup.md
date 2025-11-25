# 渲染管线配置指南

本指南介绍如何配置和使用PBR Visualizer的渲染管线,包括环境设置、材质配置和后处理效果。

## 快速开始

### 基本渲染设置

```typescript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';

const visualizer = new PBRVisualizer({
  container: document.getElementById('viewer'),
  models: [
    {
      id: 'product',
      source: '/models/product.gltf'
    }
  ],
  initialGlobalState: {
    environment: {
      type: 'noise-sphere',
      sphere: {
        radius: 0.8,
        pulse: true
      }
    }
  }
});
```

## 环境配置

### 1. HDR环境

使用真实HDR环境贴图:

```typescript
visualizer.updateEnvironment({
  type: 'hdr',
  hdr: {
    url: '/environments/studio.hdr',
    intensity: 1.0
  }
});
```

**适用场景**:
- 产品摄影风格渲染
- 需要真实反射的场景
- 室内外建筑可视化

**文件格式**: RGBE (.hdr)

**推荐分辨率**: 2048x1024 (桌面), 1024x512 (移动)

### 2. 噪波球体环境

程序化生成动态背景:

```typescript
visualizer.updateEnvironment({
  type: 'noise-sphere',
  sphere: {
    radius: 0.8,        // 球体大小 (0-1)
    pulse: true,        // 启用脉冲动画
    color1: '#1a1a2e',  // 主色调
    color2: '#16213e',  // 次色调
    speed: 1.0          // 动画速度
  }
});
```

**适用场景**:
- 抽象产品展示
- 减少资源加载
- 动态背景效果

**优势**:
- 无需加载外部文件
- 包体积小
- 动态效果

### 3. 程序化天空

简单渐变天空:

```typescript
visualizer.updateEnvironment({
  type: 'procedural-sky',
  sky: {
    topColor: '#ffffff',
    bottomColor: '#87ceeb'
  }
});
```

**适用场景**:
- 简约风格
- 性能优先
- 快速原型

## 材质配置

### PBR材质参数

```typescript
await visualizer.updateModel('product', {
  materials: {
    // 材质名称对应GLTF中的材质
    'Body': {
      color: '#ff0000',      // 基础颜色
      roughness: 0.2,        // 粗糙度 (0=镜面, 1=漫反射)
      metalness: 0.9,        // 金属度 (0=非金属, 1=金属)
      envMapIntensity: 1.0   // 环境反射强度
    },
    'Glass': {
      color: '#ffffff',
      roughness: 0.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.3
    }
  }
});
```

### 材质类型示例

#### 金属材质

```typescript
{
  color: '#c0c0c0',
  roughness: 0.2,
  metalness: 1.0
}
```

#### 塑料材质

```typescript
{
  color: '#ff5733',
  roughness: 0.5,
  metalness: 0.0
}
```

#### 玻璃材质

```typescript
{
  color: '#ffffff',
  roughness: 0.0,
  metalness: 0.0,
  transparent: true,
  opacity: 0.3
}
```

#### 木材材质

```typescript
{
  color: '#8b4513',
  roughness: 0.8,
  metalness: 0.0
}
```

## 质量配置

### 自适应质量

```typescript
const visualizer = new PBRVisualizer({
  // ...其他配置
  quality: {
    resolution: 1.0,      // 渲染分辨率倍数 (0.5-1.0)
    maxSamples: 20,       // PMREM最大采样数
    mobileOptimized: true // 移动端自动优化
  }
});
```

### 手动质量调整

```typescript
// 降低质量以提升性能
visualizer.setQuality({
  resolution: 0.75,
  maxSamples: 12
});

// 高质量渲染
visualizer.setQuality({
  resolution: 1.0,
  maxSamples: 20
});
```

### 质量预设

```typescript
// 高端设备 (RTX GPU)
const highQuality = {
  resolution: 1.0,
  maxSamples: 20,
  postProcessing: {
    enabled: true,
    aces: true,
    bloom: true,
    ssao: true
  }
};

// 中端设备
const mediumQuality = {
  resolution: 0.85,
  maxSamples: 12,
  postProcessing: {
    enabled: true,
    aces: true,
    bloom: false,
    ssao: false
  }
};

// 移动设备
const lowQuality = {
  resolution: 0.7,
  maxSamples: 6,
  postProcessing: {
    enabled: false
  }
};
```

## 后处理效果

### 启用后处理

```typescript
const visualizer = new PBRVisualizer({
  // ...其他配置
  postProcessing: {
    enabled: true,
    aces: true,          // ACES色调映射
    bloom: {
      enabled: true,
      intensity: 0.5,
      threshold: 0.8
    },
    ssao: {
      enabled: true,
      radius: 0.5,
      intensity: 1.0
    }
  }
});
```

### ACES色调映射

将HDR渲染结果映射到显示器色域:

```typescript
postProcessing: {
  aces: true,
  exposure: 1.0  // 曝光调整
}
```

**效果**: 电影级色彩,高光柔和

### Bloom泛光

为高亮区域添加辉光:

```typescript
postProcessing: {
  bloom: {
    enabled: true,
    intensity: 0.5,    // 泛光强度
    threshold: 0.8,    // 亮度阈值
    smoothWidth: 0.3   // 过渡平滑度
  }
}
```

**适用场景**: 发光材质、金属高光、玻璃反射

### SSAO环境光遮蔽

增强深度感和细节:

```typescript
postProcessing: {
  ssao: {
    enabled: true,
    radius: 0.5,       // 遮蔽半径
    intensity: 1.0,    // 遮蔽强度
    bias: 0.01         // 偏移值
  }
}
```

**效果**: 缝隙阴影,接触阴影

## 相机配置

### 设置相机位置

```typescript
// 设置相机位置和目标
visualizer.setCamera(
  [3, 2, 5],   // 位置 [x, y, z]
  [0, 0.5, 0]  // 目标 [x, y, z]
);
```

### 相机参数

```typescript
const visualizer = new PBRVisualizer({
  // ...其他配置
  initialGlobalState: {
    camera: {
      position: [3, 2, 5],
      target: [0, 0, 0],
      fov: 45,              // 视场角 (度)
      near: 0.1,            // 近裁剪面
      far: 1000             // 远裁剪面
    }
  }
});
```

### 相机控制

默认包含OrbitControls:

- **旋转**: 鼠标左键拖动
- **平移**: 鼠标右键拖动
- **缩放**: 鼠标滚轮

## 灯光配置

### 环境光

```typescript
{
  lighting: {
    ambient: {
      intensity: 0.5,
      color: '#ffffff'
    }
  }
}
```

### 方向光

```typescript
{
  lighting: {
    directional: {
      intensity: 1.0,
      color: '#ffffff',
      position: [5, 5, 5],
      castShadow: true
    }
  }
}
```

### 区域光 (RectAreaLight)

柔和的工作室灯光:

```typescript
{
  lighting: {
    rectArea: [
      {
        width: 10,
        height: 10,
        intensity: 3.0,
        color: '#ffffff',
        position: [5, 5, 0],
        rotation: [-Math.PI/2, 0, 0]
      }
    ]
  }
}
```

## 性能监控

### 启用性能统计

```typescript
const visualizer = new PBRVisualizer({
  debug: true  // 启用性能监控
});

visualizer.on('performanceUpdate', (stats) => {
  console.log('FPS:', stats.fps);
  console.log('内存:', stats.memory);
  console.log('渲染时间:', stats.renderTime);
});
```

### 自动降级

根据性能自动调整质量:

```typescript
visualizer.on('performanceUpdate', (stats) => {
  if (stats.fps < 30) {
    // FPS过低,降低质量
    visualizer.setQuality({
      resolution: 0.75,
      maxSamples: 8
    });
  }
});
```

## 渲染优化技巧

### 1. 预加载资源

```typescript
// 预加载HDR环境
const hdrLoader = new RGBELoader();
await hdrLoader.loadAsync('/environments/studio.hdr');

// 预加载模型
const gltfLoader = new GLTFLoader();
await gltfLoader.loadAsync('/models/product.gltf');
```

### 2. 减少状态更新

```typescript
// ❌ 避免频繁更新
setInterval(() => {
  visualizer.updateModel('product', { ... });
}, 16);

// ✅ 批量更新或使用动画
visualizer.batchUpdate([
  { modelId: 'product1', state: { ... } },
  { modelId: 'product2', state: { ... } }
]);
```

### 3. 使用LOD

对于复杂模型,使用LOD (Level of Detail):

```typescript
// 根据相机距离切换细节级别
visualizer.on('cameraMove', ({ distance }) => {
  const lod = distance > 10 ? 'low' : 'high';
  visualizer.setModelLOD('product', lod);
});
```

## 常见问题

### Q: 渲染很慢怎么办?

A: 尝试以下优化:
1. 降低`resolution`到0.75或0.5
2. 减少`maxSamples`到8-12
3. 禁用后处理效果
4. 使用更小的HDR贴图

### Q: 材质看起来不真实?

A: 检查以下参数:
1. `roughness`和`metalness`是否正确
2. `envMapIntensity`是否合适
3. 是否使用了合适的环境贴图
4. 是否启用了ACES色调映射

### Q: 如何实现产品配置器效果?

A: 参考以下模式:

```typescript
// 用户选择颜色
function onColorChange(color) {
  visualizer.updateModel('product', {
    materials: { body: { color } }
  });
}

// 用户选择材质
function onMaterialChange(preset) {
  const presets = {
    metal: { roughness: 0.2, metalness: 1.0 },
    plastic: { roughness: 0.5, metalness: 0.0 },
    glass: { roughness: 0.0, metalness: 0.0, transparent: true }
  };

  visualizer.updateModel('product', {
    materials: { body: presets[preset] }
  });
}
```

## 下一步

- 了解 [状态管理](../architecture/state-management.md) 实现撤销/重做
- 查看 [环境光照架构](../architecture/environment-lighting.md) 深入理解IBL
- 参考 [demo示例](../../demo/) 学习实际应用
