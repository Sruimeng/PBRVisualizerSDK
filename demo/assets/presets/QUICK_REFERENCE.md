# 预设系统快速参考

## 场景预选择指南

选择合适的场景预设非常简单 - 根据您的模型类型和展示目的：

```
┌─────────────────────────────────────────────────────────────┐
│           选择场景预设的决策树                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 您的模型是什么？                                             │
│ ├─→ 电商产品、珠宝、电子产品                               │
│ │   └─→ 使用: product-showcase ✓ (明亮专业)                │
│ │                                                           │
│ ├─→ 人物、游戏角色、NPC                                     │
│ │   └─→ 使用: character-display ✓ (柔和温暖)              │
│ │                                                           │
│ ├─→ 手机、科技配件、未来概念品                             │
│ │   └─→ 使用: tech-modern ✓ (冷色高对比)                   │
│ │                                                           │
│ ├─→ 艺术作品、雕塑、创意展示                               │
│ │   └─→ 使用: artistic-gallery ✓ (戏剧化氛围)             │
│ │                                                           │
│ └─→ CAD图纸、技术文档、细节展示                            │
│     └─→ 使用: minimal-clean ✓ (简洁清晰)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 材质选择速查表

### 按材质类型快速查找

**金属类** (metals.json)
- 需要 高反射？→ `chrome` (镀铬)
- 需要 温暖感？→ `copper` (铜)
- 需要 工业感？→ `brushed-aluminum` (拉丝铝)
- 需要 年代感？→ `rusted-iron` (生锈铁)

**塑料类** (plastics.json)
- 需要 光滑反光？→ `glossy-plastic` (光面塑料)
- 需要 无反光？→ `matte-plastic` (哑光塑料)
- 需要 鲜艳色彩？→ `red-plastic` (红色塑料)
- 需要 电子感？→ `black-plastic` (黑色塑料)

**玻璃类** (glass.json)
- 需要 完全透明？→ `clear-glass` (清玻璃)
- 需要 磨砂质感？→ `frosted-glass` (磨砂玻璃)
- 需要 颜色透明？→ `blue-glass` 或 `amber-glass`
- 需要 镜面反射？→ `mirror-glass` (镜面玻璃)

**特殊材质** (special.json)
- 需要 高端织物？→ `fabric-silk` (丝绸)
- 需要 天然木质？→ `wood-light` 或 `wood-dark`
- 需要 陶瓷质感？→ `ceramic-glossy` 或 `ceramic-matte`
- 需要 皮革感？→ `leather` (皮革)

## 常见搭配方案

### 方案 1: 高端产品展示
```json
场景: product-showcase
材质: metals → polished-steel 或 chrome
效果: 明亮、精致、专业
```

### 方案 2: 游戏角色
```json
场景: character-display
材质: special → fabric-silk (衣服) + leather (配饰)
效果: 柔和、温暖、自然
```

### 方案 3: 科技产品
```json
场景: tech-modern
材质: metals → brushed-aluminum + plastics → black-plastic
效果: 冷色、高对比、未来感
```

### 方案 4: 艺术创意
```json
场景: artistic-gallery
材质: special → wood-dark + ceramic-matte
效果: 戏剧化、意境、高端
```

## 参数调整速查

### 如果画面太暗...
```json
增加: environment.intensity (0.7 → 1.0)
或: bloom.threshold (0.8 → 0.6)
或: vignette.brightness (0.1 → 0.15)
```

### 如果金属太暗淡...
```json
增加: envMapIntensity (1.0 → 1.3)
或: roughness 降低 (0.25 → 0.15)
```

### 如果玻璃不够透明...
```json
增加: transmission (0.7 → 0.85)
或: opacity (0.9 → 1.0)
```

### 如果暗角太强...
```json
增加: vignette.brightness (0.05 → 0.15)
或: vignette.smoothness (0.15 → 0.3)
```

### 如果Bloom过度...
```json
降低: bloom.strength (0.7 → 0.4)
或: bloom.threshold (0.6 → 0.8)
```

## 金属度 & 粗糙度速查

### 金属度 (Metalness) 理解
```
0.0 = 非金属 (塑料、布料、木头)
0.2 - 0.5 = 部分金属感 (锈铁、涂装)
0.8 - 1.0 = 纯金属 (钢、铝、铜、铬)
```

### 粗糙度 (Roughness) 理解
```
0.0 - 0.1 = 镜面反射 (镀铬、光玻璃)
0.2 - 0.4 = 光滑 (抛光、丝绸)
0.5 - 0.7 = 适度粗糙 (哑光、皮革)
0.8 - 1.0 = 完全粗糙 (布料、生锈、石头)
```

## 最常用的预设组合

| 用途 | 场景 | 主要材质 | 配套材质 |
|-----|------|--------|---------|
| 珠宝展示 | product-showcase | metals/chrome | glass/clear-glass |
| 手机展示 | tech-modern | metals/brushed-aluminum | glass/mirror-glass |
| 角色展示 | character-display | special/fabric-silk | special/leather |
| 家具展示 | character-display | special/wood-dark | special/fabric-cotton |
| 玻璃产品 | artistic-gallery | glass/blue-glass | glass/clear-glass |
| 陶瓷艺术 | artistic-gallery | special/ceramic-matte | special/stone-granite |

## 移动端优化建议

如果在移动设备上性能不佳：

```json
推荐设置:
{
  "scene": "minimal-clean",
  "postProcessing": {
    "bloom": { "enabled": false },
    "ssao": { "enabled": false }
  },
  "vignette": { "enabled": false },
  "material": {
    "envMapIntensity": 0.8
  }
}
```

## 文件大小参考

| 文件 | 大小 | 加载时间 (3G) |
|-----|------|--------------|
| 单个场景预设 | ~3KB | <10ms |
| 单个材质库 | ~2-3KB | <10ms |
| catalog.json | ~8KB | <20ms |
| 全部预设 | ~30KB | <100ms |

## 常见错误和解决方案

### ❌ 问题: "预设文件找不到"
```
原因: 路径不正确或文件未上传
解决: 检查文件路径是否为 /demo/assets/presets/
      确保所有JSON文件都已上传
```

### ❌ 问题: "材质应用无效果"
```
原因: materialState 字段不正确
解决: 确保使用了 material 字段，不是其他字段名
      检查参数值是否在合理范围内
```

### ❌ 问题: "场景过度曝光"
```
原因: Bloom强度太高 + envMapIntensity太高
解决: 降低 bloom.strength 或 bloom.threshold
      或 降低 material.envMapIntensity
```

### ❌ 问题: "暗角颜色太深"
```
原因: color1 和 brightness 的组合
解决: 增加 vignette.brightness
      或 改变 vignette.color1 为更亮的颜色
```

## TypeScript 类型提示

```typescript
// 场景预设类型
interface ScenePreset {
  id: string;
  name: string;
  description: string;
  environment: { url: string; intensity: number };
  camera: CameraState;
  postProcessing: PostProcessState;
  vignette: VignetteConfig;
  defaultMaterial: MaterialState;
  tags: string[];
}

// 材质库类型
interface MaterialLibrary {
  category: 'metals' | 'plastics' | 'glass' | 'special';
  name: string;
  presets: {
    id: string;
    name: string;
    description: string;
    material: MaterialState;
  }[];
}

// 目录类型
interface PresetCatalog {
  version: string;
  scenes: ScenePreset[];
  materials: MaterialLibrary[];
  stats: {
    totalScenes: number;
    totalMaterialLibraries: number;
    totalMaterialPresets: number;
  };
}
```

## 批量导入脚本示例

```typescript
// 一次性加载所有预设
async function loadAllPresets() {
  const [
    catalog,
    productShowcase,
    characterDisplay,
    techModern,
    artisticGallery,
    minimalClean,
    metals,
    plastics,
    glass,
    special
  ] = await Promise.all([
    import('/demo/assets/presets/catalog.json'),
    import('/demo/assets/presets/scenes/product-showcase.json'),
    import('/demo/assets/presets/scenes/character-display.json'),
    import('/demo/assets/presets/scenes/tech-modern.json'),
    import('/demo/assets/presets/scenes/artistic-gallery.json'),
    import('/demo/assets/presets/scenes/minimal-clean.json'),
    import('/demo/assets/presets/materials/metals.json'),
    import('/demo/assets/presets/materials/plastics.json'),
    import('/demo/assets/presets/materials/glass.json'),
    import('/demo/assets/presets/materials/special.json')
  ]);

  return {
    catalog: catalog.default,
    scenes: {
      productShowcase: productShowcase.default,
      characterDisplay: characterDisplay.default,
      techModern: techModern.default,
      artisticGallery: artisticGallery.default,
      minimalClean: minimalClean.default
    },
    materials: {
      metals: metals.default,
      plastics: plastics.default,
      glass: glass.default,
      special: special.default
    }
  };
}
```

---

**提示**: 将此文件书签标记以快速查参考！
