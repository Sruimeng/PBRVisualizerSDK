### Code Sections (The Evidence)

#### 灯光系统 (LightSystem)

- `src/core/LightSystem.ts` (LightSystem): 灯光创建、管理和存储系统，包含灯光Map存储、Studio三点布光实现
- `src/core/LightSystem.ts` (line 17-18): `lights: Map<string, THREE.Light>` 和 `lightConfigs: Map<string, LightState>` - 灯光存储方式
- `src/core/LightSystem.ts` (line 2): `RectAreaLightUniformsLib` 导入，初始化在第40-42行
- `src/core/LightSystem.ts` (line 85-98): `createRectAreaLight()` 方法 - RectAreaLight创建
- `src/core/LightSystem.ts` (line 103-114): `createPointLight()` 方法 - PointLight创建
- `src/core/LightSystem.ts` (line 119-132): `createSpotLight()` 方法 - SpotLight创建
- `src/core/LightSystem.ts` (line 137-143): `createDirectionalLight()` 方法 - DirectionalLight创建
- `src/core/LightSystem.ts` (line 369-398): `getAllLightsInfo()` 公共方法 - 返回所有灯光信息数组

#### 后处理系统 (PostProcessSystem)

- `src/core/PostProcessSystem.ts` (PostProcessSystem): 效果合成器管理、SSAO/Bloom配置系统
- `src/core/PostProcessSystem.ts` (line 24-26): EffectComposer、RenderPass、OutputPass私有成员
- `src/core/PostProcessSystem.ts` (line 29): `ssaoPass: SSAOPass | null` - SSAO通道实例引用
- `src/core/PostProcessSystem.ts` (line 106-108): setupComposer()方法 - SSAOPass初始化和composer.addPass()配置
- `src/core/PostProcessSystem.ts` (line 164-171): `applySSAOConfig()` 方法 - SSAO配置应用，包括kernelRadius、minDistance、maxDistance设置
- `src/core/PostProcessSystem.ts` (line 208-220): `render()` 方法 - 条件渲染分支（isEnabled状态检查）
- `src/core/PostProcessSystem.ts` (line 243-247): `toggleSSAO()` 公共方法 - 切换SSAO启用状态
- `src/core/PostProcessSystem.ts` (line 275-277): `getCurrentConfig()` 公共方法 - 返回当前PostProcessState配置
- `src/core/PostProcessSystem.ts` (line 282-292): `getPerformanceInfo()` 公共方法 - 返回renderTime和passCount

#### 类型系统 (Types)

- `src/types/core.ts` (line 71-83): `PostProcessState` 接口 - 包含enabled、toneMapping、bloom、ssao、antialiasing配置
- `src/types/core.ts` (line 85-95): `SSAOConfig` 接口 - enabled、kernelRadius、minDistance、maxDistance参数
- `src/types/core.ts` (line 24-38): `LightState` 接口 - 灯光状态定义（type、enabled、color、intensity、position、size）
- `src/types/core.ts` (line 25-27): 灯光类型枚举 - 'rectAreaLight' | 'pointLight' | 'spotLight' | 'directionalLight'

#### PBRVisualizer主类 (Public API)

- `src/PBRVisualizer.ts` (line 37-41): 核心系统私有成员 - renderer、environmentSystem、lightSystem、postProcessSystem、materialSystem
- `src/PBRVisualizer.ts` (line 197): `initialize()` 公共异步方法 - 初始化入口
- `src/PBRVisualizer.ts` (line 332): `loadModel()` 公共异步方法 - 模型加载
- `src/PBRVisualizer.ts` (line 430): `updateModel()` 公共异步方法 - 更新模型状态
- `src/PBRVisualizer.ts` (line 502): `batchUpdate()` 公共异步方法 - 批量更新模型
- `src/PBRVisualizer.ts` (line 642-644): `captureFrame()` 公共方法 - 截图功能（调用postProcessSystem.captureFrame()）
- `src/PBRVisualizer.ts` (line 671-676): `on()` 公共方法 - 事件监听注册
- `src/PBRVisualizer.ts` (line 789): `get initialized()` - 初始化状态getter

#### Three.js依赖

- `package.json` (line 53): Three.js版本 `^0.181.2`
- `package.json` (line 52): postprocessing库版本 `^6.33.4`
- `src/core/PostProcessSystem.ts` (line 2-5): Three.js导入 - EffectComposer、RenderPass、SSAOPass、OutputPass来自three/examples/jsm/postprocessing

#### Renderer系统

- `src/core/Renderer.ts`: WebGL渲染器封装，处理画布管理和性能监控

### Report (The Answers)

#### result

##### 1. 灯光系统调查

**灯光存储方式**：

- LightSystem使用 `Map<string, THREE.Light>` 存储所有创建的灯光（src/core/LightSystem.ts:17）
- 配置通过 `Map<string, LightState>` 并行存储（src/core/LightSystem.ts:18）
- Studio三点布光的keyLight、rimLight、fillLight作为独立的RectAreaLight实例成员存储（src/core/LightSystem.ts:21-23）

**灯光类型支持**：

- RectAreaLight：矩形区域灯光，支持宽度和高度配置（第85-98行）
- PointLight：点光源（第103-114行）
- SpotLight：聚光灯（第119-132行）
- DirectionalLight：平行光（第137-143行）
- Three.js RectAreaLightUniformsLib已在构造器中初始化（第40-42行）

**Helper导入现状**：

- RectAreaLightUniformsLib已导入并初始化：`import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'`
- Three.js内置Helper类（RectAreaLightHelper、SpotLightHelper、DirectionalLightHelper等）**未被导入**，需要添加导入语句

**可视化所需公共方法**：

- `getAllLightsInfo()` - 返回所有灯光信息数组（第369-398行）
- `getLight(id: string)` - 获取单个灯光对象（第199-201行）
- `createLight(id, config)` - 创建灯光（第47-80行）

##### 2. PostProcessSystem调查

**SSAOPass引用位置**：

- SSAOPass实例创建在 `setupComposer()` 方法第106行：`this.ssaoPass = new SSAOPass(this.scene, this.camera, width, height)`
- SSAOPass存储为私有成员变量 `private ssaoPass: SSAOPass | null = null`（第29行）

**SSAOPass配置属性**：

- `enabled` - 启用/禁用标志（第167行）
- `kernelRadius` - 采样核半径（第168行）
- `minDistance` - 最小距离（第169行）
- `maxDistance` - 最大距离（第170行）
- Three.js SSAOPass的output属性**不在当前代码中使用**，但可支持显示不同Buffer（DEFAULT/SSAO/NORMAL/DEPTH等）

**EffectComposer通道配置**：

- 渲染通道按顺序添加：RenderPass → SSAOPass → OutputPass（第103-111行）
- `composer.passes` 数组包含所有渲染通道（在getPerformanceInfo()第289行访问）
- 通道数量可通过 `getPerformanceInfo()` 方法获取（第282-292行）

**渲染分支机制**：

- `isEnabled` 标志控制渲染分支：启用时执行 `composer.render()`，禁用时直接 `renderer.render()`（第209-217行）
- 初始化时通过 `this.isEnabled = this.currentConfig.enabled` 同步状态（第57行）

##### 3. 类型系统调查

**现有类型定义**：

- `PostProcessState` 接口（src/types/core.ts:71-83）：包含enabled、toneMapping、bloom、ssao、antialiasing配置
- `SSAOConfig` 接口（src/types/core.ts:85-95）：定义SSAO参数
- `LightState` 接口（src/types/core.ts:24-38）：定义灯光状态

**扩展点**：

- 可在 `PostProcessState` 中添加新的debug相关字段（如debugMode、bufferVisualizationType）
- 可创建新的 `DebugConfig` 接口来统一管理所有Debug功能配置

##### 4. PBRVisualizer主类调查

**子系统暴露方式**：

- 五个核心系统作为私有成员：`private renderer`、`private environmentSystem`、`private lightSystem`、`private postProcessSystem`、`private materialSystem`（第37-41行）
- **当前所有子系统均为私有成员，不直接暴露**
- PBRVisualizer采用外观模式，通过公共方法间接访问子系统功能

**现有公共方法**：

- `initialize()` - 初始化（第197行）
- `loadModel()` - 加载模型（第332行）
- `updateModel()` - 更新模型状态（第430行）
- `batchUpdate()` - 批量更新（第502行）
- `on()`/`off()` - 事件注册（第671-686行）
- `getPerformanceStats()` - 获取性能统计（第649行）
- `getCurrentState()` - 获取当前状态（第661行）
- `captureFrame()` - 截图（第642行）
- `dispose()` - 销毁（第747行）

**Debug API添加策略**：

- 可添加公共getter方法（如 `get light(): LightSystem`）或专属debug命名空间对象
- 当前架构支持通过PBRVisualizer添加新的公共方法来暴露debug功能

##### 5. Three.js依赖调查

**当前版本**：

- Three.js: `^0.181.2`（package.json:53）
- postprocessing库: `^6.33.4`（package.json:52）

**Helper类可用性**：

- RectAreaLightHelper、SpotLightHelper、DirectionalLightHelper、PointLightHelper 在Three.js 0.181.2中作为标准导出
- 导入路径：`import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'`（以此类推其他Helper）
- SSAOPass的output属性在0.181.2版本中支持多种可视化模式

**后处理能力**：

- SSAOPass支持多种Buffer输出模式（通过output属性）
- 深度Buffer可通过Renderer.depth property访问
- 法线Buffer需要通过g-buffer或自定义通道获取

#### conclusions

- **灯光系统完整**：LightSystem已有完整的灯光创建、管理、Studio三点布光等基础设施，仅需添加RectAreaLightHelper等Helper类导入
- **后处理系统可视化就绪**：SSAOPass、PostProcessSystem已完全就绪，通过output属性和renderPass可实现Buffer可视化
- **类型系统可扩展**：现有PostProcessState和SSAOConfig可直接扩展，无需大改
- **API暴露需要规划**：当前PBRVisualizer采用严格的外观模式，子系统私有，需要通过新增public debug命名空间方法来暴露debug功能
- **Three.js版本充分**：0.181.2已包含所有必要的Helper和效果类，无版本限制

#### relations

- `PBRVisualizer.ts` 协调 `LightSystem.ts` 和 `PostProcessSystem.ts` 的初始化（第65-72行setupCoreSystems）
- `PBRVisualizer.ts` 在initialize()中调用子系统的配置方法（第254-266行applyGlobalState）
- `PostProcessSystem.ts` 在render()中通过isEnabled标志控制渲染流程（第208-220行）
- `LightSystem.ts` 中Studio三点布光通过 `createStudioLighting()` 方法与模型边界耦合（第213-276行）
- 类型定义 `src/types/core.ts` 被 `PostProcessSystem.ts` 和 `PBRVisualizer.ts` 导入使用
- `package.json` 中的Three.js版本决定了可用的Helper类和后处理效果的完整性

---

## 实现Debug模式需要修改的文件清单

### 需要修改的文件列表

1. **src/types/core.ts** - 添加Debug相关类型定义（DebugConfig、DebugState等）
2. **src/core/LightSystem.ts** - 添加Helper创建和管理方法
3. **src/core/PostProcessSystem.ts** - 添加Buffer可视化方法
4. **src/PBRVisualizer.ts** - 添加public debug命名空间API和子系统getter

### 需要新增的文件

- **src/core/DebugSystem.ts** - Debug管理系统（可选，用于统一管理所有Debug功能）

### 依赖关系图

```
类型系统 (types/core.ts)
    ↓
LightSystem (灯光Helper)
    ↓
PostProcessSystem (Buffer可视化)
    ↓
PBRVisualizer (debug API暴露)
```

### 关键实现点

1. **灯光Helper**：需在LightSystem中创建Helper实例并add到scene
2. **Buffer可视化**：通过SSAOPass的output属性或自定义材质渲染Buffer
3. **API控制**：通过visualizer.debug.toggleLightHelper()、visualizer.debug.visualizeBuffer()等方法
4. **状态同步**：Debug状态应集成到StateTransaction事务系统中
