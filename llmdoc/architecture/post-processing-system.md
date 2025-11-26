# PostProcessSystem 后处理系统架构

## 1. Identity

- **What it is**: 基于Three.js EffectComposer的高性能WebGL后处理渲染系统
- **Purpose**: 为3D场景提供SSAO、Bloom、色调映射等专业级后处理效果，支持条件渲染和性能优化

## 2. 核心组件

- **`src/core/PostProcessSystem.ts` (PostProcessSystem, EffectComposer, SSAOPass)**: 统一后处理效果管理和渲染管线控制
- **渲染通道管理**: RenderPass、SSAOPass、OutputPass的动态配置和启用控制
- **配置系统**: PostProcessState配置结构和实时配置更新机制

## 3. 执行流程 (LLM Retrieval Map)

### 初始化流程

- **1. 系统创建**: 构造函数接收renderer、scene、camera参数 (`src/core/PostProcessSystem.ts:39-64`)
- **2. 配置同步**: `this.isEnabled = this.currentConfig.enabled` 确保启用状态与配置一致 (`src/core/PostProcessSystem.ts:57`)
- **3. 合成器设置**: EffectComposer初始化和渲染通道配置 (`src/core/PostProcessSystem.ts:99-112`)

### 渲染流程

- **1. 条件检查**: `render()` 方法检查 `isEnabled` 标志 (`src/core/PostProcessSystem.ts:209`)
- **2. 分支渲染**:
  - 启用时执行 `composer.render()` 执行后处理管线 (`src/core/PostProcessSystem.ts:217`)
  - 禁用时直接调用 `renderer.render()` 跳过后处理 (`src/core/PostProcessSystem.ts:211`)

### 配置更新流程

- **1. 配置接收**: `setConfig()` 接收Partial<PostProcessState>配置 (`src/core/PostProcessSystem.ts:117-141`)
- **2. 状态同步**: 通过 `setEnabled()` 同步 `isEnabled` 标志 (`src/core/PostProcessSystem.ts:122-124`)
- **3. 效果应用**: 各个apply方法应用具体配置到对应渲染通道

## 4. 设计特点

### 条件渲染机制

- **启用同步**: 构造器中同步 `isEnabled` 与配置，解决初始化时机问题
- **运行时切换**: 支持运行时动态启用/禁用后处理效果
- **性能优化**: 禁用时绕过EffectComposer直接渲染，减少性能开销

### 模块化效果管理

- **独立配置**: 每种后处理效果独立配置和控制
- **默认优化**: SSAO默认开启提升立体感，Bloom默认关闭考虑性能
- **API封装**: 提供toggleSSAO、toggleBloom等便捷控制方法

### 性能监控集成

- **渲染时间统计**: 记录每次后处理渲染耗时
- **通道计数**: 监控EffectComposer中的渲染通道数量
- **状态查询**: 提供完整的性能信息和配置状态查询接口
