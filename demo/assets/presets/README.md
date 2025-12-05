# PBR Visualizer SDK 预设系统文档

## 概述

本目录包含PBR Visualizer SDK的完整预设系统，包括5个场景预设和4个材质库（共28个材质预设），可以快速应用到您的模型中获得不同的视觉效果。

## 目录结构

```
presets/
├── scenes/                      # 场景预设
│   ├── product-showcase.json    # 产品展示场景（明亮、专业）
│   ├── character-display.json   # 角色展示场景（柔和、温暖）
│   ├── tech-modern.json         # 科技现代风格（冷色、高对比）
│   ├── artistic-gallery.json    # 艺术画廊风格（戏剧化、高Bloom）
│   └── minimal-clean.json       # 极简清洁风格（简单、低效果）
├── materials/                   # 材质库
│   ├── metals.json              # 金属材质库（6个预设）
│   ├── plastics.json            # 塑料材质库（6个预设）
│   ├── glass.json               # 玻璃材质库（6个预设）
│   └── special.json             # 特殊材质库（10个预设）
└── catalog.json                 # 预设目录索引
```

## 场景预设详情

### 1. 产品展示 (product-showcase.json)

**用途**：电商产品展示、商业摄影风格

**特点**：
- 明亮的环境强度：1.2
- 温和的Bloom效果：强度 0.3
- 禁用SSAO，保持清洁感
- 白色光亮暗角背景

**适用于**：珠宝、电子产品、小型物品、商业产品

**参数亮点**：
```json
{
  "bloom": { "strength": 0.3, "threshold": 0.85 },
  "vignette": { "brightness": 0.15, "color": "#e8e8e8 -> #f5f5f5" }
}
```

### 2. 角色展示 (character-display.json)

**用途**：人物模型、游戏角色、IP形象展示

**特点**：
- 温暖的环境强度：0.9
- 柔和的Bloom效果：强度 0.4
- 启用SSAO（kernelRadius: 5），增加立体感
- 温暖的棕色暗角背景

**适用于**：人物角色、NPC、IP形象、肖像照

**参数亮点**：
```json
{
  "ssao": { "enabled": true, "kernelRadius": 5 },
  "vignette": { "brightness": 0.12, "color": "#3d2817 -> #8b6f47" }
}
```

### 3. 科技现代 (tech-modern.json)

**用途**：科技产品、高端硬件、未来感展示

**特点**：
- 强烈的环境强度：1.4
- 强劲的Bloom效果：强度 0.7，低阈值 0.6
- 启用SSAO（kernelRadius: 6），强对比度
- 深蓝色高对比暗角背景

**适用于**：手机、平板、科技配件、概念设计、VR设备

**参数亮点**：
```json
{
  "bloom": { "strength": 0.7, "radius": 0.6, "threshold": 0.6 },
  "ssao": { "enabled": true, "kernelRadius": 6 },
  "vignette": { "brightness": 0.08, "color": "#0a1929 -> #1e3a8a" }
}
```

### 4. 艺术画廊 (artistic-gallery.json)

**用途**：艺术作品、概念艺术、创意展示、高端品牌

**特点**：
- 较低的环境强度：0.7
- 强烈的Bloom效果：强度 1.2，低阈值 0.4
- 启用SSAO（kernelRadius: 7），营造氛围
- 深紫色戏剧化暗角背景

**适用于**：艺术雕塑、概念艺术、高端品牌、游戏宣传

**参数亮点**：
```json
{
  "bloom": { "strength": 1.2, "radius": 0.8, "threshold": 0.4 },
  "ssao": { "enabled": true, "kernelRadius": 7 },
  "vignette": { "brightness": 0.05, "color": "#0d0221 -> #3a0ca3" }
}
```

### 5. 极简清洁 (minimal-clean.json)

**用途**：技术文档、模型细节展示、教育用途、产品对比

**特点**：
- 标准环境强度：1.0
- 禁用所有Bloom效果
- 禁用SSAO
- 禁用暗角效果

**适用于**：CAD展示、技术手册、产品工程图、教育演示

**参数亮点**：
```json
{
  "postProcessing": {
    "bloom": { "enabled": false },
    "ssao": { "enabled": false }
  },
  "vignette": { "enabled": false }
}
```

## 材质库详情

### 金属材质库 (metals.json) - 6个预设

| 预设ID | 名称 | 金属度 | 粗糙度 | 特点 |
|--------|------|--------|--------|------|
| polished-steel | 抛光钢 | 0.95 | 0.08 | 镜面反光，高端感 |
| brushed-aluminum | 拉丝铝 | 0.90 | 0.25 | 拉丝纹理，工业感 |
| copper | 铜 | 0.98 | 0.12 | 温暖金属，电气感 |
| brass | 黄铜 | 0.95 | 0.15 | 深金色，古典感 |
| rusted-iron | 生锈铁 | 0.40 | 0.80 | 粗糙生锈，年代感 |
| chrome | 镀铬 | 1.00 | 0.05 | 完全反光，豪华感 |

### 塑料材质库 (plastics.json) - 6个预设

| 预设ID | 名称 | 金属度 | 粗糙度 | 特点 |
|--------|------|--------|--------|------|
| glossy-plastic | 光面塑料 | 0.0 | 0.15 | 光滑反光，消费品感 |
| matte-plastic | 哑光塑料 | 0.0 | 0.60 | 无反光，日用感 |
| red-plastic | 红色塑料 | 0.0 | 0.20 | 鲜艳色彩，玩具感 |
| black-plastic | 黑色塑料 | 0.0 | 0.70 | 深色哑光，电子感 |
| translucent-plastic | 半透明塑料 | 0.0 | 0.40 | 透光质感，现代感 |
| textured-plastic | 纹理塑料 | 0.0 | 0.75 | 工程塑料，工业感 |

### 玻璃材质库 (glass.json) - 6个预设

| 预设ID | 名称 | 粗糙度 | 透射率 | 特点 |
|--------|------|--------|--------|------|
| clear-glass | 清玻璃 | 0.05 | 0.95 | 完全透明，水晶感 |
| frosted-glass | 磨砂玻璃 | 0.40 | 0.70 | 磨砂质感，隐私感 |
| blue-glass | 蓝色玻璃 | 0.08 | 0.85 | 深蓝色透明，水感 |
| amber-glass | 琥珀玻璃 | 0.10 | 0.80 | 琥珀色，温暖感 |
| thick-glass | 厚玻璃 | 0.15 | 0.50 | 低透射，厚重感 |
| mirror-glass | 镜面玻璃 | 0.02 | 0.10 | 高反射，镜面感 |

### 特殊材质库 (special.json) - 10个预设

#### 织物类
| 预设ID | 名称 | 粗糙度 | 特点 |
|--------|------|--------|------|
| fabric-cotton | 棉布 | 0.90 | 粗糙无光，天然感 |
| fabric-silk | 丝绸 | 0.25 | 光滑闪亮，豪华感 |
| fabric-velvet | 天鹅绒 | 0.95 | 柔软厚实，高端感 |

#### 木材类
| 预设ID | 名称 | 粗糙度 | 特点 |
|--------|------|--------|------|
| wood-light | 浅木 | 0.50 | 浅色自然，温暖感 |
| wood-dark | 深木 | 0.60 | 深色乌木，沉稳感 |

#### 陶瓷和石材
| 预设ID | 名称 | 粗糙度 | 特点 |
|--------|------|--------|------|
| ceramic-glossy | 光面陶瓷 | 0.30 | 光滑反光，精致感 |
| ceramic-matte | 哑光陶瓷 | 0.75 | 哑光质感，古韵感 |
| stone-granite | 花岗岩 | 0.80 | 粗糙硬质，厚重感 |

#### 其他
| 预设ID | 名称 | 粗糙度 | 特点 |
|--------|------|--------|------|
| rubber | 橡胶 | 0.85 | 柔软无光，工业感 |
| leather | 皮革 | 0.65 | 质感细腻，高级感 |

## 使用指南

### 方式1：直接加载场景预设

```typescript
import { PBRVisualizer } from '@pbr-visualizer/sdk';
import productPreset from '/demo/assets/presets/scenes/product-showcase.json';

const visualizer = new PBRVisualizer({
  container: document.getElementById('canvas'),
  models: [
    {
      id: 'model-1',
      source: '/path/to/model.glb'
    }
  ],
  initialGlobalState: productPreset as GlobalState
});
```

### 方式2：加载材质预设并应用

```typescript
import materialsLibrary from '/demo/assets/presets/materials/metals.json';

// 获取具体的材质预设
const polishedSteel = materialsLibrary.presets[0].material;

// 应用到模型
visualizer.setModelState('model-1', {
  material: {
    color: polishedSteel.color,
    metalness: polishedSteel.metalness,
    roughness: polishedSteel.roughness,
    envMapIntensity: polishedSteel.envMapIntensity
  }
});
```

### 方式3：混合使用场景和材质预设

```typescript
import scenePreset from '/demo/assets/presets/scenes/tech-modern.json';
import materialsLibrary from '/demo/assets/presets/materials/metals.json';

// 应用场景
visualizer.updateGlobalState(scenePreset);

// 应用材质
const selectedMaterial = materialsLibrary.presets.find(p => p.id === 'copper');
visualizer.setModelState('model-1', {
  material: selectedMaterial.material
});
```

### 方式4：浏览预设目录

```typescript
import catalog from '/demo/assets/presets/catalog.json';

// 列出所有场景
console.log(catalog.scenes);  // 5个场景预设

// 列出所有材质库
console.log(catalog.materials);  // 4个材质库

// 获取特定材质库的信息
const metalsLibrary = catalog.materials.find(m => m.id === 'metals');
console.log(metalsLibrary.presetCount);  // 6
```

## 参数说明

### 场景预设参数范围

| 参数 | 最小值 | 最大值 | 推荐值 |
|-----|--------|--------|--------|
| environment.intensity | 0.0 | 2.0 | 0.7-1.4 |
| bloom.strength | 0.0 | 1.5 | 0.3-1.2 |
| bloom.radius | 0.0 | 1.0 | 0.3-0.8 |
| bloom.threshold | 0.0 | 1.0 | 0.4-0.9 |
| ssao.kernelRadius | 1 | 10 | 4-7 |
| ssao.minDistance | 0.001 | 0.02 | 0.005-0.01 |
| ssao.maxDistance | 0.05 | 0.5 | 0.1-0.25 |
| vignette.smoothness | 0.0 | 0.5 | 0.15-0.3 |
| vignette.brightness | 0.0 | 0.3 | 0.05-0.15 |
| vignette.radiusScale | 1.0 | 2.0 | 1.3-1.6 |

### 材质预设参数范围

| 参数 | 最小值 | 最大值 | 说明 |
|-----|--------|--------|------|
| metalness | 0.0 | 1.0 | 0 = 非金属，1 = 完全金属 |
| roughness | 0.0 | 1.0 | 0 = 光滑反光，1 = 粗糙无光 |
| envMapIntensity | 0.0 | 2.0 | 环境映射强度，0 = 无反射 |
| transmission | 0.0 | 1.0 | 光线透射率，仅针对玻璃 |
| opacity | 0.0 | 1.0 | 透明度，0 = 完全透明，1 = 完全不透明 |

## 建议搭配

### 产品类模型
```
场景：product-showcase 或 tech-modern
材质：metals 或 plastics
效果：高照度，强Bloom，精细暗角
```

### 游戏角色模型
```
场景：character-display
材质：special（皮肤、衣服、配件）
效果：柔和照度，适度Bloom，温暖暗角
```

### 艺术创意展示
```
场景：artistic-gallery
材质：special（各类艺术材料）
效果：戏剧化照度，强烈Bloom，深色暗角
```

### 技术文档展示
```
场景：minimal-clean
材质：metals
效果：标准照度，无特效，清晰细节
```

## 常见问题

### Q1: 如何自定义预设？
A: 可以基于现有预设复制并修改参数。确保保持JSON结构一致性，并根据需要调整各参数值。

### Q2: 能否混合多个场景预设？
A: 可以。通过手动合并JSON对象，将不同预设的参数结合在一起。但注意环境强度和Bloom强度的叠加可能产生过度曝光。

### Q3: 如何实现场景过渡动画？
A: 通过动画系统（如 Tween.js）在两个预设参数之间进行插值动画：
```typescript
// 从当前场景过渡到新场景
gsap.to(currentScene, {
  'bloom.strength': newScene.postProcessing.bloom.strength,
  'vignette.brightness': newScene.vignette.brightness,
  duration: 1.0
});
```

### Q4: 移动端性能考虑？
A: 在移动设备上，建议：
- 使用 minimal-clean 场景
- 禁用 SSAO
- 降低 Bloom 强度
- 禁用或减弱暗角效果

## 版本历史

### v1.0.0 (2025-12-04)
- 初始版本
- 5个场景预设
- 4个材质库（28个材质预设）
- 完整的参数文档

## 许可证和使用条款

这些预设文件是PBR Visualizer SDK的一部分，遵循相同的许可证条款。可自由用于商业和非商业项目。

---

**最后更新**: 2025-12-04
**维护者**: PBR Visualizer SDK Team
