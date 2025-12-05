# Demo系统状态参考

## 1. 核心摘要

Demo演示系统已恢复正常运行状态，包含完整的资源文件和功能模块，可直接用于PBR Visualizer SDK的功能展示和测试验证。

## 2. 源文件信息

### 资源文件清单

- **3D模型文件**: `demo/glb/` 目录包含4个GLB模型文件

  - `Camera_XHS_17479384306051040g00831hpgdts3jo6g5pmo3n0nc99qji23br8.glb` (22.8MB)
  - `military+character+3d+model_Clone1.glb` (3.8MB)
  - `moon_knight_mecha_marvel_rivals.glb` (36.0MB)
  - `test.glb` (9.0MB)

- **环境贴图**: `demo/hdr/env.hdr` (6.6MB) - HDR环境贴图，用于PBR渲染

- **配置文件**: `demo/tsconfig.json` - TypeScript配置文件

### 演示文件清单

- `demo/html/ai_studio_code.html` - AI Studio风格演示
- `demo/html/material-editor/sdk-simple.html` - SDK材质编辑器演示
- `demo/html/preset-switcher/index.html` - 预设切换演示页面

### 预设系统文件清单

- **预设加载器实现**: `demo/src/preset-switcher.ts` - PresetLoader和PresetSwitcherDemo完整实现

- **预设数据文件**:
  - `demo/assets/presets/catalog.json` - 预设目录索引（5个场景 + 4个材质库 = 28个材质）
  - `demo/assets/presets/README.md` - 预设系统说明文档
  - `demo/assets/presets/QUICK_REFERENCE.md` - 快速参考指南
  - `demo/assets/presets/EXAMPLES.ts` - TypeScript代码示例

- **场景预设**（5个）:
  - `demo/assets/presets/scenes/product-showcase.json` - 产品展示场景
  - `demo/assets/presets/scenes/character-display.json` - 角色展示场景
  - `demo/assets/presets/scenes/tech-modern.json` - 科技现代场景
  - `demo/assets/presets/scenes/artistic-gallery.json` - 艺术画廊场景
  - `demo/assets/presets/scenes/minimal-clean.json` - 极简清洁场景

- **材质库**（4个，共28个材质）:
  - `demo/assets/presets/materials/metals.json` - 金属材质库（6个预设）
  - `demo/assets/presets/materials/plastics.json` - 塑料材质库（6个预设）
  - `demo/assets/presets/materials/glass.json` - 玻璃材质库（6个预设）
  - `demo/assets/presets/materials/special.json` - 特殊材质库（10个预设）

- **演示实现文档**:
  - `demo/html/preset-switcher/README.md` - 演示说明文档
  - `demo/html/preset-switcher/QUICKSTART.md` - 快速开始指南
  - `demo/html/preset-switcher/IMPLEMENTATION_REPORT.md` - 实现报告

## 3. 源文件位置

- **Primary Code**: `demo/` - 完整的演示系统目录
- **Models**: `demo/glb/` - 3D模型资源文件
- **Environment**: `demo/hdr/env.hdr` - HDR环境贴图
- **Configuration**: `demo/tsconfig.json` - TypeScript配置
- **Preset System**: `demo/assets/presets/` - 预设数据和资源文件
- **Preset Implementation**: `demo/src/preset-switcher.ts` - 预设系统TypeScript实现
- **Preset Demo**: `demo/html/preset-switcher/` - 预设切换演示HTML和文档
- **Related Documentation**: `/llmdoc/agent/demo目录更新分析报告.md` - Demo系统分析报告
- **Preset Guide**: `/llmdoc/guides/preset-system-guide.md` - 预设系统使用指南

## 4. 使用说明

### 直接访问

```bash
# 开发环境访问
http://localhost:8083/demo/html/ai_studio_code.html
http://localhost:8083/demo/html/material-editor/sdk-simple.html
http://localhost:8083/demo/html/preset-switcher/index.html

# 生产环境访问
https://your-domain/demo/html/ai_studio_code.html
https://your-domain/demo/html/preset-switcher/index.html
```

### 预设系统访问

```bash
# 使用 PresetLoader 加载预设
import { PresetLoader } from '/demo/src/preset-switcher';

const loader = new PresetLoader();
const catalog = await loader.loadCatalog();        # 加载预设目录
const scene = await loader.loadScene('product-showcase');  # 加载场景预设
const materials = await loader.loadMaterialLibrary('metals'); # 加载材质库
```

### 资源引用

示例代码中的模型和预设路径可更新为实际可用文件：

```javascript
// 使用demo中的模型文件
const model = await visualizer.loadModel('/demo/glb/test.glb');
const environment = await visualizer.loadEnvironmentHDRI('/demo/hdr/env.hdr');

// 使用预设系统
const scenePreset = await loader.loadScene('product-showcase');
const materialLibrary = await loader.loadMaterialLibrary('metals');
```

## 5. 系统状态

- ✅ **Demo系统**: 完全正常运行
- ✅ **资源文件**: 4个3D模型 + 1个HDR环境贴图 + 配置文件
- ✅ **演示功能**: 3个核心HTML演示文件（AI Studio、Material Editor、Preset Switcher）
- ✅ **预设系统**: 5个场景预设 + 4个材质库（28个材质）
- ✅ **预设实现**: PresetLoader和PresetSwitcherDemo完整实现
- ✅ **文档同步**: 相关文档已更新（预设系统指南、demo系统状态、主索引）

## 6. 下一步

- 使用提供的演示文件验证SDK功能
- 参考API文档进行二次开发
- 根据需要扩展新的演示场景
- 查看预设系统指南学习如何使用预设系统

## 7. 预设系统详解

### 7.1 预设系统概述

预设系统提供了开箱即用的场景和材质配置，用户可以：
- 快速切换5种预设场景（产品展示、角色展示、科技现代等）
- 应用28个预设材质（金属、塑料、玻璃、特殊材料）
- 使用PresetLoader API加载和管理预设

### 7.2 核心API

**PresetLoader类**:
- `loadScene(sceneName)` - 加载场景预设
- `loadMaterialLibrary(libraryName)` - 加载材质库
- `loadCatalog()` - 加载预设目录
- `clearCache()` - 清除缓存

**PresetSwitcherDemo类**:
- `switchScene(sceneName)` - 切换场景预设
- `switchMaterialLibrary(libraryName)` - 切换材质库
- `switchMaterial(materialId)` - 切换具体材质
- `switchModel(modelUrl)` - 切换模型
- `getCurrentState()` - 获取当前状态

### 7.3 场景预设配置内容

每个场景预设包含：
- **环境配置**: HDR环境贴图和强度
- **相机设置**: 位置、目标、视场角等
- **后处理**: Bloom、SSAO、色调映射等效果
- **暗角配置**: 背景球体的颜色和参数
- **默认材质**: 模型的初始材质设置

### 7.4 材质库结构

每个材质库包含多个材质预设：
- **metals**: 6个金属材质（钢、铝、铜、黄铜、铁、镀铬）
- **plastics**: 6个塑料材质（光面、哑光、软塑料等）
- **glass**: 6个玻璃材质（清玻璃、磨砂玻璃等）
- **special**: 10个特殊材质（织物、木材、陶瓷、石头等）

### 7.5 快速入门

```typescript
import { PresetSwitcherDemo } from '/demo/src/preset-switcher';

// 创建演示实例（自动初始化）
const demo = new PresetSwitcherDemo();

// 切换场景
await demo.switchScene('product-showcase');

// 切换材质库
await demo.switchMaterialLibrary('metals');

// 切换具体材质
await demo.switchMaterial('polished-steel');
```

详细信息请参考 `/llmdoc/guides/preset-system-guide.md`
