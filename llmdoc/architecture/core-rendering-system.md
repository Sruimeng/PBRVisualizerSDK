# PBR Visualizer 核心渲染系统架构

## 1. Identity

- **What it is**: 基于Three.js的高性能WebGL PBR渲染系统，采用分层架构和模块化设计
- **Purpose**: 为产品可视化和材质预览提供统一、高性能的渲染解决方案

## 2. 核心组件

### PBRVisualizer 主类 (`src/PBRVisualizer.ts`)
- **核心功能**: 统一渲染器入口，负责协调所有子系统（728行代码）
- **关键职责**: 状态管理、模型加载、事务系统、事件分发
- **架构模式**: 外观模式，为复杂渲染系统提供简洁接口

### 渲染器 (`src/core/Renderer.ts`)
- **核心功能**: WebGL渲染器管理和渲染循环
- **关键职责**: 画布管理、性能监控、渲染质量控制
- **性能特性**: 帧率统计、DrawCall计数、三角形统计

### 环境系统 (`src/core/EnvironmentSystem.ts`)
- **核心功能**: HDR环境贴图和程序化环境
- **关键职责**: PMREM预过滤、环境光照、IBL设置
- **优化特性**: 环境贴图缓存、重复加载检测

### 灯光系统 (`src/core/LightSystem.ts`)
- **核心功能**: 多种光源类型和Studio三点布光
- **关键职责**: 动态光照配置、自适应灯光强度
- **特色功能**: RectAreaLight支持、模型边界自适应

### 后处理系统 (`src/core/PostProcessSystem.ts`)
- **核心功能**: 效果合成器管理和后处理效果
- **关键职责**: SSAO接触阴影、Bloom泛光、色调映射
- **性能监控**: 渲染时间统计、通道计数
- **初始化同步**: 构造器中 `this.isEnabled = this.currentConfig.enabled`（第57行），确保启用状态与配置一致
- **条件渲染**: `render()` 方法根据 `isEnabled` 标志选择执行合成器渲染或直接渲染（第208-213行）

### 材质系统 (`src/core/MaterialSystem.ts`)
- **核心功能**: PBR材质管理和纹理缓存
- **关键职责**: 材质参数更新、纹理加载、材质预设
- **优化特性**: 材质缓存、纹理复用、各向异性过滤

## 3. 执行流程

### 初始化流程
1. **系统创建**: `PBRVisualizer:65-72` - 创建核心系统实例
2. **渲染器初始化**: `Renderer:89-125` - 配置WebGL渲染器和场景
3. **子系统设置**: `PBRVisualizer:113-135` - 初始化环境、灯光、后处理、材质系统
4. **应用默认状态**: `PBRVisualizer:168-207` - 加载环境配置和应用相机设置

### 模型加载流程
1. **模型加载**: `PBRVisualizer:267-324` - GLTF/DRACO加载器处理
2. **模型优化**: `PBRVisualizer:329-345` - 包围盒计算、居中、缩放
3. **材质优化**: `MaterialSystem:211-253` - 材质属性优化和纹理设置
4. **Studio布光**: `PBRVisualizer:349-360` - 自动创建三点布光系统

### 渲染循环流程
1. **控制器更新**: `PBRVisualizer:251-252` - OrbitControls状态更新
2. **后处理渲染**: `PBRVisualizer:255` - EffectComposer执行（通过 `PostProcessSystem.render()`，自动检查 `isEnabled` 标志）
3. **性能统计**: `PBRVisualizer:258` - 实时性能数据更新
4. **事件分发**: `PBRVisualizer:266-269` - 性能事件通知

**后处理启用流程**：
1. **初始化同步**: 构造器中 `this.isEnabled = this.currentConfig.enabled`（第57行），与默认配置保持同步
2. **配置应用**: `setConfig()` 接收外部配置并通过 `setEnabled()` 同步 `isEnabled` 标志（第122-124行）
3. **条件渲染**: `render()` 检查 `isEnabled` 标志（第209行），为 `true` 时执行 `composer.render()`，否则直接调用 `renderer.render()`（第211行）

### 状态管理流程
1. **事务创建**: `PBRVisualizer:459-477` - 生成状态快照
2. **批量更新**: `PBRVisualizer:483-503` - 多模型统一更新
3. **材质更新**: `PBRVisualizer:466-472` - 先更新MaterialSystem配置，再应用到模型
4. **应用状态**: `PBRVisualizer:559-568` - 全局和模型状态应用
5. **撤销重做**: `PBRVisualizer:527-554` - 事务历史管理

## 4. 系统交互关系

### 数据流向
```
用户输入 → PBRVisualizer → 状态管理 → 各子系统 → 渲染输出
     ↓               ↓            ↓         ↓
   事件监听    事务系统    配置更新   WebGL渲染
```

### 依赖层次
```
门面层: PBRVisualizer (统一接口)
   ↓
核心层: Renderer, EnvironmentSystem, LightSystem, PostProcessSystem, MaterialSystem
   ↓
基础层: Three.js WebGL, EffectComposer, 纹理管理
```

### 关键接口设计
- **环境系统**: `EnvironmentSystem.setEnvironment()` → 场景环境配置
- **灯光系统**: `LightSystem.createStudioLighting()` → 自动布光生成
- **材质系统**: `MaterialSystem.updateMaterial()` → 材质配置更新，支持自动创建
- **后处理系统**: `PostProcessSystem.render()` → 渲染管线输出

## 5. 设计原则

### 模块化设计
- **单一职责**: 每个系统负责特定领域功能
- **接口分离**: 清晰的输入输出接口定义
- **松耦合**: 系统间通过明确的数据结构通信

### 性能优化
- **缓存机制**: 材质、纹理、环境贴图多级缓存
- **延迟加载**: 资源按需加载和预过滤
- **性能监控**: 内置FPS、DrawCall、内存使用统计

### 可扩展性
- **配置驱动**: 所有系统支持运行时配置更新
- **事件驱动**: 基于观察者模式的状态变更通知
- **预设系统**: 内置材质和环境预设，支持自定义扩展

## 6. 关键优化特性

### 渲染优化
- **PMREM预过滤**: 环境贴图预处理提升IBL质量
- **各向异性过滤**: 纹理采样质量优化
- **延迟渲染**: 后处理效果统一合成

### 内存管理
- **资源复用**: 材质和纹理缓存避免重复创建
- **自动清理**: 生命周期管理和资源释放
- **内存统计**: 实时内存使用监控

### 质量控制
- **自适应质量**: 根据设备性能自动调整渲染质量
- **色调映射**: ACES Filmic色调映射提升视觉效果
- **抗锯齿**: FXAA和后处理抗锯齿选项

这个核心渲染系统通过模块化设计和优化的渲染管线，为PBR可视化提供了高性能、可扩展的技术基础。