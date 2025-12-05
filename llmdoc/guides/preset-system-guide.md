# 预设系统使用指南

## 1. 概述

预设系统是PBR Visualizer SDK中的一个强大功能，提供了预先配置的场景和材质集合，可以帮助用户快速创建专业的3D可视化应用。这个系统包括：

- **5个场景预设**：不同风格的场景配置，包括环境、灯光、后处理等
- **4个材质库**：包含28个精心设计的材质预设
- **预设加载器**：智能缓存机制和异步加载
- **预设切换演示**：完整的实现示例和最佳实践

## 2. 目录结构

### 预设资源目录

```
demo/assets/presets/
├── catalog.json                    # 预设目录索引
├── README.md                       # 预设系统说明文档
├── QUICK_REFERENCE.md              # 快速参考指南
├── EXAMPLES.ts                     # TypeScript代码示例
├── scenes/                         # 场景预设集合
│   ├── product-showcase.json      # 产品展示场景
│   ├── character-display.json     # 角色展示场景
│   ├── tech-modern.json           # 科技现代场景
│   ├── artistic-gallery.json      # 艺术画廊场景
│   └── minimal-clean.json         # 极简清洁场景
└── materials/                      # 材质库集合
    ├── metals.json                # 金属材质库（6个预设）
    ├── plastics.json              # 塑料材质库（6个预设）
    ├── glass.json                 # 玻璃材质库（6个预设）
    └── special.json               # 特殊材质库（10个预设）
```

### 演示实现文件

```
demo/
├── src/
│   └── preset-switcher.ts         # 预设系统完整实现
└── html/
    └── preset-switcher/
        ├── index.html             # 演示HTML页面
        ├── README.md              # 演示说明文档
        ├── QUICKSTART.md          # 快速开始指南
        └── IMPLEMENTATION_REPORT.md # 实现报告
```

## 3. 场景预设使用方法

### 3.1 场景预设概览

PBR Visualizer SDK提供了5个精心设计的场景预设，每个预设都针对不同的用途优化：

| 预设ID | 名称 | 描述 | 适用场景 | Bloom | SSAO | 暗角 |
|--------|------|------|---------|-------|------|------|
| `product-showcase` | 产品展示 | 明亮专业的产品展示 | 电商产品 | 0.3 | ✗ | ✓ |
| `character-display` | 角色展示 | 柔和温暖的角色显示 | 人物模型 | 0.4 | ✓ | ✓ |
| `tech-modern` | 科技现代 | 冷色调现代科技风格 | 科技产品 | 0.7 | ✓ | ✓ |
| `artistic-gallery` | 艺术画廊 | 戏剧化的艺术氛围 | 艺术作品 | 1.2 | ✓ | ✓ |
| `minimal-clean` | 极简清洁 | 极简风格的清洁场景 | 细节展示 | 0.0 | ✗ | ✗ |

### 3.2 基础使用

#### 使用PresetLoader加载场景

```typescript
import { PresetLoader } from '@/demo/src/preset-switcher';

const loader = new PresetLoader();

// 加载场景预设
const productShowcase = await loader.loadScene('product-showcase');
console.log('Loaded scene:', productShowcase);

// 预设目录包含元数据
const catalog = await loader.loadCatalog();
console.log('Available scenes:', catalog.scenes);
```

#### 加载场景预设到PBRVisualizer

```typescript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import { PresetLoader } from '@/demo/src/preset-switcher';

const visualizer = new PBRVisualizer({ container: '#app' });
const loader = new PresetLoader();

// 加载场景预设
const scenePreset = await loader.loadScene('product-showcase');

// 应用环境配置
await visualizer.loadEnvironmentHDRI(scenePreset.environment.url);
visualizer.setGlobalState({
  environment: {
    intensity: scenePreset.environment.intensity,
    url: scenePreset.environment.url,
  },
});

// 应用后处理配置
visualizer.setPostProcessing(scenePreset.postProcessing);

// 应用暗角配置
visualizer.setModelVignette('model1', scenePreset.vignette);
```

### 3.3 场景预设结构详解

每个场景预设都是一个JSON文件，包含以下配置：

```json
{
  "id": "product-showcase",
  "name": "产品展示",
  "description": "专业的产品展示场景",
  "environment": {
    "url": "/demo/hdr/env.hdr",
    "intensity": 1.2,
    "studio": true
  },
  "camera": {
    "position": { "x": 0, "y": 1.2, "z": 3.5 },
    "target": { "x": 0, "y": 0.5, "z": 0 },
    "fov": 45,
    "controls": { "enabled": true, "autoRotate": true }
  },
  "postProcessing": {
    "enabled": true,
    "bloom": { "enabled": true, "strength": 0.3 },
    "ssao": { "enabled": false },
    "toneMapping": { "type": "ACESFilmicToneMapping" }
  },
  "vignette": {
    "enabled": true,
    "color1": "#e8e8e8",
    "color2": "#f5f5f5"
  },
  "defaultMaterial": {
    "color": "#ffffff",
    "metalness": 0.3,
    "roughness": 0.3
  },
  "tags": ["product", "commercial", "bright"]
}
```

### 3.4 实际应用示例

#### 示例：产品展示场景切换

```typescript
async function setupProductShowcase() {
  const visualizer = new PBRVisualizer({
    container: '#app',
    models: [
      { id: 'product', url: '/models/product.glb' }
    ]
  });

  const loader = new PresetLoader();
  const preset = await loader.loadScene('product-showcase');

  // 应用完整预设配置
  await visualizer.loadEnvironmentHDRI(preset.environment.url);

  visualizer.setGlobalState({
    environment: {
      intensity: preset.environment.intensity,
      url: preset.environment.url,
    }
  });

  visualizer.setPostProcessing(preset.postProcessing);
  visualizer.setModelVignette('product', preset.vignette);
  visualizer.setModelMaterial('product', preset.defaultMaterial);
}
```

## 4. 材质预设使用方法

### 4.1 材质库概览

SDK提供了4个材质库，包含28个精心设计的材质预设：

| 库名 | ID | 预设数 | 描述 | 典型用途 |
|------|-----|---------|------|---------|
| 金属材质库 | `metals` | 6个 | 各种金属材质效果 | 金属产品、机械零件 |
| 塑料材质库 | `plastics` | 6个 | 光面到哑光塑料 | 塑料制品、消费品 |
| 玻璃材质库 | `glass` | 6个 | 清玻璃到彩色玻璃 | 玻璃制品、透明物体 |
| 特殊材质库 | `special` | 10个 | 织物、木材、陶瓷等 | 多种特殊材料 |

### 4.2 金属材质库（metals）

```typescript
const metalPresets = {
  "polished-steel": {      // 抛光钢
    metalness: 0.95,
    roughness: 0.08,
    color: "#b8b8b8"
  },
  "brushed-aluminum": {    // 拉丝铝
    metalness: 0.9,
    roughness: 0.25,
    color: "#d0d0d0"
  },
  "copper": {              // 铜
    metalness: 0.98,
    roughness: 0.12,
    color: "#b87333"
  },
  "brass": {               // 黄铜
    metalness: 0.95,
    roughness: 0.15,
    color: "#cd7f32"
  },
  "rusted-iron": {         // 生锈铁
    metalness: 0.4,
    roughness: 0.8,
    color: "#8b4513"
  },
  "chrome": {              // 镀铬
    metalness: 1.0,
    roughness: 0.05,
    color: "#e8e8e8"
  }
};
```

### 4.3 塑料材质库（plastics）

```typescript
const plasticPresets = {
  "glossy-plastic": {      // 光面塑料
    metalness: 0.0,
    roughness: 0.15,
    color: "#ffffff"
  },
  "matte-plastic": {       // 哑光塑料
    metalness: 0.0,
    roughness: 0.6,
    color: "#e0e0e0"
  },
  "soft-plastic": {        // 软塑料
    metalness: 0.0,
    roughness: 0.35,
    color: "#f5f5f5"
  },
  "rubber": {              // 橡胶
    metalness: 0.0,
    roughness: 0.8,
    color: "#333333"
  },
  "translucent": {         // 半透明塑料
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.5
  },
  "opaque": {              // 不透明塑料
    metalness: 0.0,
    roughness: 0.4,
    color: "#cccccc"
  }
};
```

### 4.4 玻璃材质库（glass）

```typescript
const glassPresets = {
  "clear-glass": {         // 清玻璃
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5
  },
  "frosted-glass": {       // 磨砂玻璃
    metalness: 0.0,
    roughness: 0.4,
    transmission: 0.7,
    ior: 1.5
  },
  "tinted-glass": {        // 着色玻璃
    metalness: 0.0,
    roughness: 0.08,
    transmission: 0.8,
    color: "#87ceeb"
  },
  "reflective-glass": {    // 反光玻璃
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6
  },
  "thick-glass": {         // 厚玻璃
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.6
  },
  "textured-glass": {      // 纹理玻璃
    metalness: 0.0,
    roughness: 0.35,
    transmission: 0.7
  }
};
```

### 4.5 特殊材质库（special）

```typescript
const specialPresets = {
  "fabric-silk": {         // 丝绸
    metalness: 0.0,
    roughness: 0.25,
    color: "#f0d9b5"
  },
  "fabric-cotton": {       // 棉布
    metalness: 0.0,
    roughness: 0.6,
    color: "#fffacd"
  },
  "wood-light": {          // 浅木
    metalness: 0.0,
    roughness: 0.5,
    color: "#daa520"
  },
  "wood-dark": {           // 深木
    metalness: 0.0,
    roughness: 0.6,
    color: "#8b4513"
  },
  "ceramic-glossy": {      // 光面陶瓷
    metalness: 0.0,
    roughness: 0.3,
    color: "#f5f5dc"
  },
  "ceramic-matte": {       // 哑光陶瓷
    metalness: 0.0,
    roughness: 0.7,
    color: "#e0d7c3"
  },
  "stone-marble": {        // 大理石
    metalness: 0.0,
    roughness: 0.3,
    color: "#f0f8ff"
  },
  "stone-granite": {       // 花岗岩
    metalness: 0.0,
    roughness: 0.4,
    color: "#808080"
  },
  "leather": {             // 皮革
    metalness: 0.0,
    roughness: 0.5,
    color: "#8b4513"
  },
  "velvet": {              // 天鹅绒
    metalness: 0.0,
    roughness: 0.8,
    color: "#4b0082"
  }
};
```

### 4.6 材质预设使用

#### 基础材质应用

```typescript
import { PresetLoader, PresetSwitcherDemo } from '@/demo/src/preset-switcher';

const loader = new PresetLoader();

// 加载材质库
const metalsLibrary = await loader.loadMaterialLibrary('metals');

// 获取特定材质配置
const polishedSteel = metalsLibrary.presets.find(p => p.id === 'polished-steel');

// 应用到模型
visualizer.setModelMaterial('product', polishedSteel.material);
```

#### 材质库切换

```typescript
async function switchMaterialLibrary(libraryName: string) {
  const loader = new PresetLoader();
  const library = await loader.loadMaterialLibrary(libraryName);

  // 更新UI显示可用的材质
  const materialOptions = library.presets.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description
  }));

  updateMaterialUI(materialOptions);
}
```

#### 完整的材质切换示例

```typescript
async function applyMaterial(materialId: string) {
  const loader = new PresetLoader();

  // 从所有库中查找材质
  const libraries = ['metals', 'plastics', 'glass', 'special'];

  for (const libName of libraries) {
    const library = await loader.loadMaterialLibrary(libName);
    const material = library.presets.find(p => p.id === materialId);

    if (material) {
      visualizer.setModelMaterial('model1', material.material);
      console.log(`Applied material: ${material.name}`);
      return;
    }
  }

  console.warn(`Material not found: ${materialId}`);
}
```

## 5. PresetLoader API参考

### 5.1 构造函数

```typescript
const loader = new PresetLoader();
```

### 5.2 方法

#### loadScene(sceneName: string): Promise<any>

加载指定的场景预设。

**参数：**
- `sceneName` (string): 场景ID，如 'product-showcase'

**返回值：**
- Promise<any>: 场景配置对象

**示例：**
```typescript
const preset = await loader.loadScene('tech-modern');
```

#### loadMaterialLibrary(libraryName: string): Promise<any>

加载指定的材质库。

**参数：**
- `libraryName` (string): 库名称，如 'metals', 'plastics', 'glass', 'special'

**返回值：**
- Promise<any>: 材质库对象，包含presets数组

**示例：**
```typescript
const library = await loader.loadMaterialLibrary('metals');
const materials = library.presets; // 包含所有6个金属材质
```

#### loadCatalog(): Promise<any>

加载预设目录，获取所有可用预设的元数据。

**返回值：**
- Promise<any>: 目录对象，包含scenes和materials数组

**示例：**
```typescript
const catalog = await loader.loadCatalog();
console.log('Available scenes:', catalog.scenes.length); // 5
console.log('Total materials:', catalog.stats.totalMaterialPresets); // 28
```

#### clearCache(): void

清除所有缓存的预设数据。

**用途：**
- 在应用卸载时清理内存
- 重新加载最新的预设配置

**示例：**
```typescript
loader.clearCache();
```

## 6. PresetSwitcherDemo API参考

### 6.1 构造函数

```typescript
const demo = new PresetSwitcherDemo();
```

自动初始化PBRVisualizer实例和加载预设目录。

### 6.2 方法

#### switchScene(sceneName: string): Promise<void>

切换到指定的场景预设。

**参数：**
- `sceneName` (string): 场景ID

**功能：**
- 加载场景配置
- 更新环境设置
- 应用后处理效果
- 更新暗角配置
- 同步UI状态

**示例：**
```typescript
await demo.switchScene('artistic-gallery');
```

#### switchMaterialLibrary(libraryName: string): Promise<void>

切换到指定的材质库。

**参数：**
- `libraryName` (string): 库名称 ('metals', 'plastics', 'glass', 'special')

**功能：**
- 加载材质库配置
- 更新UI材质选项
- 应用第一个材质预设

**示例：**
```typescript
await demo.switchMaterialLibrary('glass');
```

#### switchMaterial(materialId: string): Promise<void>

切换到指定的材质预设。

**参数：**
- `materialId` (string): 材质ID

**功能：**
- 应用材质配置到当前模型
- 更新UI显示

**示例：**
```typescript
await demo.switchMaterial('clear-glass');
```

#### switchModel(modelUrl: string): Promise<void>

加载和切换3D模型。

**参数：**
- `modelUrl` (string): 模型文件URL

**功能：**
- 卸载当前模型
- 加载新模型
- 应用当前材质预设到新模型

**示例：**
```typescript
await demo.switchModel('/models/new-product.glb');
```

#### getCurrentState(): object

获取当前的预设状态。

**返回值：**
```typescript
{
  scene: string,           // 当前场景ID
  materialLibrary: string, // 当前材质库
  material: string,        // 当前材质ID
  model: string           // 当前模型URL
}
```

**示例：**
```typescript
const state = demo.getCurrentState();
console.log(`Current scene: ${state.scene}`);
console.log(`Current material: ${state.material}`);
```

## 7. 完整代码示例

### 7.1 基础初始化

```typescript
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import { PresetLoader } from '@/demo/src/preset-switcher';

async function initializeWithPresets() {
  // 创建可视化器
  const visualizer = new PBRVisualizer({
    container: '#app',
    models: [
      {
        id: 'model1',
        url: '/demo/glb/test.glb',
        visible: true
      }
    ]
  });

  // 创建预设加载器
  const loader = new PresetLoader();

  // 加载并应用场景预设
  try {
    const preset = await loader.loadScene('product-showcase');

    // 应用环境
    await visualizer.loadEnvironmentHDRI(preset.environment.url);
    visualizer.setGlobalState({
      environment: {
        intensity: preset.environment.intensity,
        url: preset.environment.url
      }
    });

    // 应用后处理
    visualizer.setPostProcessing(preset.postProcessing);

    // 应用暗角
    visualizer.setModelVignette('model1', preset.vignette);

    // 应用默认材质
    visualizer.setModelMaterial('model1', preset.defaultMaterial);

    console.log('Scene preset applied successfully');
  } catch (error) {
    console.error('Failed to apply preset:', error);
  }
}

initializeWithPresets();
```

### 7.2 场景和材质交互

```typescript
import { PresetSwitcherDemo } from '@/demo/src/preset-switcher';

async function setupPresetUI() {
  const demo = new PresetSwitcherDemo();
  const catalog = await demo.presetLoader.loadCatalog();

  // 创建场景按钮
  const sceneContainer = document.getElementById('scene-buttons');
  catalog.scenes.forEach(scene => {
    const button = document.createElement('button');
    button.textContent = scene.name;
    button.onclick = () => demo.switchScene(scene.id);
    sceneContainer.appendChild(button);
  });

  // 创建材质库按钮
  const libraryContainer = document.getElementById('library-buttons');
  catalog.materials.forEach(lib => {
    const button = document.createElement('button');
    button.textContent = lib.name;
    button.onclick = () => demo.switchMaterialLibrary(lib.id);
    libraryContainer.appendChild(button);
  });
}

setupPresetUI();
```

### 7.3 高级用法 - 自定义预设应用

```typescript
async function applyCustomPresetCombination() {
  const loader = new PresetLoader();

  // 加载不同的预设
  const scenePreset = await loader.loadScene('tech-modern');
  const materialLibrary = await loader.loadMaterialLibrary('metals');

  // 组合应用
  visualizer.setGlobalState({
    environment: {
      url: scenePreset.environment.url,
      intensity: 1.5  // 自定义强度
    }
  });

  // 应用自定义的后处理
  visualizer.setPostProcessing({
    ...scenePreset.postProcessing,
    bloom: {
      ...scenePreset.postProcessing.bloom,
      strength: 0.5  // 自定义Bloom强度
    }
  });

  // 应用材质库中的特定材质
  const selectedMaterial = materialLibrary.presets[2];
  visualizer.setModelMaterial('model1', selectedMaterial.material);
}
```

## 8. 最佳实践

### 8.1 预设缓存管理

```typescript
// 好的做法：复用PresetLoader实例以利用缓存
const presetLoader = new PresetLoader();

async function switchScenes(sceneNames: string[]) {
  for (const name of sceneNames) {
    // 后续调用会使用缓存，提高性能
    const preset = await presetLoader.loadScene(name);
    applyPreset(preset);
  }
}

// 应用卸载时清理缓存
window.addEventListener('beforeunload', () => {
  presetLoader.clearCache();
});
```

### 8.2 错误处理

```typescript
async function safeLoadPreset(sceneName: string) {
  try {
    const loader = new PresetLoader();
    const preset = await loader.loadScene(sceneName);
    return preset;
  } catch (error) {
    console.error(`Failed to load preset: ${sceneName}`, error);
    // 返回默认预设或null
    return null;
  }
}
```

### 8.3 UI状态同步

```typescript
class PresetManager {
  private currentScene: string = 'product-showcase';
  private currentLibrary: string = 'metals';

  async switchScene(sceneName: string) {
    try {
      await this.demo.switchScene(sceneName);
      this.currentScene = sceneName;
      this.updateUI();
    } catch (error) {
      console.error('Scene switch failed:', error);
      this.showError('Failed to switch scene');
    }
  }

  private updateUI() {
    // 更新按钮活跃状态
    document.querySelectorAll('[data-scene]').forEach(btn => {
      btn.classList.toggle('active',
        btn.getAttribute('data-scene') === this.currentScene);
    });
  }

  private showError(message: string) {
    // 显示错误提示
    alert(message);
  }
}
```

## 9. 常见问题解答

### Q1: 预设资源文件在哪里？
预设资源位于 `demo/assets/presets/` 目录，包括场景和材质配置文件。

### Q2: 如何创建自定义预设？
编辑相应的JSON文件，遵循现有预设的格式，或创建新的JSON文件。

### Q3: 预设系统如何处理网络错误？
PresetLoader会抛出异常，应用应该正确处理这些异常并提供用户反馈。

### Q4: 可以在运行时修改预设吗？
可以。加载预设后，使用visualizer的API进行修改，修改会覆盖预设配置。

### Q5: 预设文件如何组织？
每个场景和材质库都是独立的JSON文件，catalog.json提供索引和元数据。

## 10. 下一步

- 查看 `demo/html/preset-switcher/` 中的完整演示实现
- 阅读 `demo/assets/presets/README.md` 了解预设详细信息
- 参考 `demo/assets/presets/EXAMPLES.ts` 获取更多代码示例
