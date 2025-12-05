# PBR Visualizer 预设切换演示

## 概述

预设切换演示（Preset Switcher Demo）是一个完整的PBR Visualizer SDK应用示例，展示了如何使用预设系统来快速切换场景、材质和模型。该演示提供了一个专业的用户界面，允许用户实时切换5种场景预设和4种材质库中的28种预设。

## 文件结构

```
demo/
├── src/
│   └── preset-switcher.ts          # 预设切换演示的TypeScript实现
├── html/
│   └── preset-switcher/
│       └── index.html              # 预设切换演示的HTML页面
└── assets/presets/
    ├── catalog.json                # 预设目录（场景和材质）
    ├── scenes/
    │   ├── product-showcase.json   # 产品展示场景
    │   ├── character-display.json  # 角色展示场景
    │   ├── tech-modern.json        # 科技现代场景
    │   ├── artistic-gallery.json   # 艺术画廊场景
    │   └── minimal-clean.json      # 极简清洁场景
    └── materials/
        ├── metals.json             # 金属材质库
        ├── plastics.json           # 塑料材质库
        ├── glass.json              # 玻璃材质库
        └── special.json            # 特殊材质库
```

## 功能特性

### 1. 预设加载器（PresetLoader）

```typescript
class PresetLoader {
  async loadScene(sceneName: string): Promise<any>
  async loadMaterialLibrary(libraryName: string): Promise<any>
  async loadCatalog(): Promise<any>
  clearCache(): void
}
```

**核心功能：**
- 加载和缓存JSON预设文件
- 支持场景预设、材质库加载
- 内置缓存机制，避免重复网络请求
- 自动错误处理

### 2. 预设切换演示（PresetSwitcherDemo）

```typescript
class PresetSwitcherDemo {
  async switchScene(sceneName: string): Promise<void>
  async switchMaterialLibrary(libraryName: string): Promise<void>
  async switchMaterial(materialId: string): Promise<void>
  async switchModel(modelUrl: string): Promise<void>
  getCurrentState(): { scene, materialLibrary, material, model }
}
```

**核心功能：**
- 场景预设切换：切换环境、后处理、相机、暗角等
- 材质库切换：动态加载材质库并更新UI
- 材质切换：应用具体的材质配置
- 模型切换：加载和卸载3D模型
- UI状态同步：自动更新配置参数显示

## 使用方法

### 基础使用

#### 1. HTML中使用

在HTML中，所有功能都通过全局函数暴露，可以直接调用：

```html
<!-- 切换场景 -->
<button onclick="switchScene('product-showcase')">产品展示</button>
<button onclick="switchScene('tech-modern')">科技现代</button>

<!-- 切换材质库 -->
<button onclick="switchMaterialLibrary('metals')">金属材质</button>

<!-- 切换具体材质 -->
<button onclick="switchMaterial('polished-steel')">抛光钢</button>

<!-- 切换模型 -->
<button onclick="switchModel('/demo/glb/test.glb')">标准模型</button>
```

#### 2. TypeScript中使用

```typescript
import { PresetSwitcherDemo } from '/demo/src/preset-switcher.ts';

const demo = new PresetSwitcherDemo();

// 切换场景
await demo.switchScene('product-showcase');

// 切换材质库和材质
await demo.switchMaterialLibrary('metals');
await demo.switchMaterial('polished-steel');

// 获取当前状态
const state = demo.getCurrentState();
console.log(state);
// 输出: { scene: 'product-showcase', materialLibrary: 'metals', material: 'polished-steel', model: 'main_model' }
```

### 场景预设

#### 1. 产品展示（product-showcase）

```json
{
  "id": "product-showcase",
  "name": "产品展示",
  "description": "专业的产品展示场景，明亮专业，适合电商产品拍摄",
  "environment": { "url": "/demo/hdr/env.hdr", "intensity": 1.2, "studio": true },
  "postProcessing": {
    "enabled": true,
    "bloom": { "enabled": true, "strength": 0.3, "radius": 0.3, "threshold": 0.85 }
  },
  "vignette": {
    "enabled": true,
    "color1": "#e8e8e8",
    "color2": "#f5f5f5",
    "smoothness": 0.25,
    "brightness": 0.15,
    "radiusScale": 1.3
  }
}
```

**应用配置：**
- 环境：明亮的HDR环境
- 后处理：轻微的Bloom效果
- 相机：自动旋转
- 暗角：浅色暗角

#### 2. 角色展示（character-display）

- 温暖的环境光
- 柔和的Bloom效果
- SSAO阴影
- 适合展示人物角色

#### 3. 科技现代（tech-modern）

- 冷色调环境
- 强Bloom效果（0.7）
- 高对比度SSAO
- 突出现代科技感

#### 4. 艺术画廊（artistic-gallery）

- 戏剧化的灯光
- 强Bloom效果（1.2）
- 艺术氛围
- 适合艺术作品展示

#### 5. 极简清洁（minimal-clean）

- 最少后处理效果
- 无暗角
- 突出模型细节
- 清洁简约风格

### 材质预设

#### 金属材质库（metals）

| ID | 名称 | 金属度 | 粗糙度 |
|---|---|---|---|
| polished-steel | 抛光钢 | 0.95 | 0.08 |
| brushed-aluminum | 拉丝铝 | 0.9 | 0.25 |
| copper | 铜 | 0.98 | 0.12 |
| brass | 黄铜 | 0.95 | 0.15 |
| rusted-iron | 生锈铁 | 0.4 | 0.8 |
| chrome | 镀铬 | 1.0 | 0.05 |

#### 塑料材质库（plastics）

- 光面塑料（glossy-plastic）：metalness 0.0, roughness 0.15
- 哑光塑料（matte-plastic）：metalness 0.0, roughness 0.6
- 等等...

#### 玻璃材质库（glass）

- 清玻璃（clear-glass）：transmission 0.95, roughness 0.05
- 磨砂玻璃（frosted-glass）：transmission 0.7, roughness 0.4
- 等等...

#### 特殊材质库（special）

包括织物、木材、陶瓷等10种材质预设

### 可用模型

```
demo/glb/
├── test.glb (9.0MB) - 标准测试模型
├── Camera_XHS_*.glb (22.8MB) - 相机模型
├── military+character+3d+model_Clone1.glb (3.7MB) - 军事角色
└── moon_knight_mecha_marvel_rivals.glb (34MB) - 月骑士机甲
```

## API参考

### PresetLoader

#### `loadScene(sceneName: string): Promise<any>`

加载指定的场景预设。

**参数：**
- `sceneName` - 场景ID（product-showcase, character-display等）

**返回值：** 场景配置对象，包含environment、postProcessing、camera、vignette等

**示例：**
```typescript
const scene = await loader.loadScene('product-showcase');
```

#### `loadMaterialLibrary(libraryName: string): Promise<any>`

加载指定的材质库。

**参数：**
- `libraryName` - 材质库名称（metals, plastics, glass, special）

**返回值：** 材质库对象，包含presets数组

**示例：**
```typescript
const library = await loader.loadMaterialLibrary('metals');
console.log(library.presets); // [{ id: 'polished-steel', ... }, ...]
```

#### `loadCatalog(): Promise<any>`

加载预设目录，包含所有场景和材质库的索引。

**返回值：** 目录对象，包含scenes数组和materials数组

**示例：**
```typescript
const catalog = await loader.loadCatalog();
console.log(catalog.scenes); // [{ id: 'product-showcase', ... }, ...]
```

### PresetSwitcherDemo

#### `switchScene(sceneName: string): Promise<void>`

切换到指定的场景预设。

**功能：**
1. 加载场景配置
2. 应用环境配置
3. 应用后处理配置
4. 应用相机配置
5. 应用暗角配置
6. 应用默认材质
7. 更新UI显示

**示例：**
```typescript
await demo.switchScene('tech-modern');
```

#### `switchMaterialLibrary(libraryName: string): Promise<void>`

切换到指定的材质库。

**功能：**
1. 加载材质库
2. 更新材质选择下拉框
3. 自动选择第一个材质

**示例：**
```typescript
await demo.switchMaterialLibrary('metals');
```

#### `switchMaterial(materialId: string): Promise<void>`

切换到指定的材质。

**功能：**
1. 查找材质配置
2. 应用材质到模型
3. 更新UI显示参数

**示例：**
```typescript
await demo.switchMaterial('polished-steel');
```

#### `switchModel(modelUrl: string): Promise<void>`

切换到指定的模型。

**功能：**
1. 卸载当前模型
2. 加载新模型
3. 重新应用场景和材质

**示例：**
```typescript
await demo.switchModel('/demo/glb/test.glb');
```

## 配置示例

### 场景预设结构

```typescript
interface ScenePreset {
  id: string;
  name: string;
  description: string;
  environment: {
    url: string;
    intensity: number;
    studio?: boolean;
  };
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov?: number;
    controls?: {
      enabled: boolean;
      autoRotate: boolean;
      autoRotateSpeed: number;
    };
  };
  postProcessing: {
    enabled: boolean;
    bloom: {
      enabled: boolean;
      strength: number;
      radius: number;
      threshold: number;
    };
    ssao: {
      enabled: boolean;
      kernelRadius: number;
      minDistance: number;
      maxDistance: number;
    };
  };
  vignette: {
    enabled: boolean;
    color1: string;
    color2: string;
    smoothness: number;
    brightness: number;
    radiusScale: number;
  };
}
```

### 材质预设结构

```typescript
interface MaterialLibrary {
  category: string;
  name: string;
  description: string;
  presets: Array<{
    id: string;
    name: string;
    description: string;
    material: {
      color: string;
      metalness: number;
      roughness: number;
      envMapIntensity: number;
      aoMapIntensity?: number;
      transmission?: number;
      opacity?: number;
    };
  }>;
}
```

## 开发指南

### 添加新的场景预设

1. 创建新的JSON文件：`demo/assets/presets/scenes/your-scene.json`
2. 定义场景配置（参考现有场景）
3. 在 `catalog.json` 中添加索引

### 添加新的材质

1. 编辑相应的材质库JSON文件（如 `metals.json`）
2. 添加新的材质预设对象
3. 重新加载应用

### 自定义样式

HTML文件中的所有样式都定义在 `<style>` 标签中，可以直接修改CSS来自定义外观：

```css
/* 修改左侧面板宽度 */
.container {
  grid-template-columns: 320px 1fr 320px; /* 默认280px */
}

/* 修改按钮样式 */
.quick-button {
  padding: 10px 14px; /* 默认8px 12px */
}
```

## 最佳实践

### 1. 预设管理

```typescript
// 好做法：预先加载目录，获取所有可用预设
const catalog = await presetLoader.loadCatalog();
const scenes = catalog.scenes; // [{ id: '...', name: '...', ... }]

// 坏做法：每次切换都重新加载（低效）
await presetLoader.loadScene('product-showcase');
```

### 2. 缓存利用

```typescript
// PresetLoader会自动缓存已加载的预设
// 重复加载同一个预设不会再次网络请求
await demo.switchScene('product-showcase'); // 网络请求
await demo.switchScene('product-showcase'); // 从缓存读取
```

### 3. 错误处理

```typescript
try {
  await demo.switchScene('nonexistent-scene');
} catch (error) {
  console.error('Failed to switch scene:', error);
  // 恢复到前一个状态或使用默认值
}
```

### 4. UI同步

```typescript
// switchScene、switchMaterial等方法会自动更新UI
// 无需手动同步UI状态
await demo.switchScene('tech-modern');
// HTML中的配置显示面板会自动更新
```

## 常见问题

### Q: 如何添加自定义材质预设？

A: 编辑 `demo/assets/presets/materials/` 中对应的JSON文件，添加新的预设对象即可。

### Q: 预设文件找不到怎么办？

A: 检查：
1. 文件路径是否正确
2. 网络连接是否正常
3. 浏览器控制台的错误信息

### Q: 如何提高加载性能？

A: PresetLoader已内置缓存机制。可以进一步优化：
1. 压缩预设JSON文件
2. 使用CDN加速
3. 预加载常用预设

## 技术栈

- **Three.js**: 3D渲染
- **TypeScript**: 类型安全的代码
- **PBR Visualizer SDK**: 核心渲染和材质系统
- **Fetch API**: 预设文件加载
- **CSS Grid**: 响应式布局

## 浏览器兼容性

- Chrome/Edge：完全支持
- Firefox：完全支持
- Safari：完全支持（需要WebGL2）
- IE11：不支持

## 许可证

与PBR Visualizer SDK相同

## 相关文档

- [PBR Visualizer SDK 文档](../../llmdoc/index.md)
- [核心渲染系统架构](../../llmdoc/architecture/core-rendering-system.md)
- [PBR材质系统](../../llmdoc/architecture/pbr-material-system.md)
- [API使用示例](../../llmdoc/reference/api-examples.md)
