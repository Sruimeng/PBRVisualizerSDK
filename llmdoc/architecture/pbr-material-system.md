# PBR材质系统架构

## 1. Identity

- **What it is**: 基于物理渲染的材质管理系统，支持多种材质类型、纹理映射和预设系统
- **Purpose**: 为产品可视化提供高质量、高性能的PBR材质渲染解决方案

## 2. 核心组件

### MaterialSystem 主类 (`src/core/MaterialSystem.ts`)

- **核心功能**: PBR材质的创建、管理和更新
- **关键职责**: 材质缓存、纹理管理、预设系统、性能优化
- **架构模式**: 策略模式 + 工厂模式，支持多种材质创建策略
- **更新机制**: 支持自动创建材质配置，无需预先定义

### 材质编辑器类 (`src/demo/sdk-simple.ts:MaterialEditor`)

- **核心功能**: 独立的材质编辑器实现，集成Debug功能，与主系统分离
- **关键职责**: UI控制器、材质预设、参数验证、错误处理、Debug功能集成
- **架构模式**: 模块化设计，支持独立初始化和配置，内置Debug简化和代理
- **类型安全**: 完整的TypeScript类型定义（MaterialParams, MaterialPreset）
- **Debug集成**: 提供toggleDebug()、toggleLightHelpers()、cycleBufferMode()等简化调试API

### 材质状态接口 (`src/types/core.ts:128-154`)

- **MaterialState**: PBR材质的核心参数定义
- **材质参数**: color, roughness, metalness, emissive, envMapIntensity等
- **纹理映射**: normalMap, aoMap, emissiveMap, metallicRoughnessMap支持
- **透明材质**: transmission, transparent, opacity用于玻璃等透射材质

### 材质缓存系统 (`src/core/MaterialSystem.ts:17-32`)

- **材质缓存**: Map<string, THREE.Material> - 基于配置的材质缓存
- **纹理缓存**: Map<string, THREE.Texture> - 纹理资源复用
- **配置管理**: Map<string, MaterialState> - 材质配置持久化

### 着色器集成 (`src/shaders/`)

- **IBLSphere**: 动态环境着色器，支持程序化背景
- **纹理采样**: 各向异性过滤优化纹理采样质量
- **材质合成**: 基于物理的光照计算和材质混合

## 3. 执行流程 (LLM Retrieval Map)

### 材质创建流程

1. **配置验证**: `MaterialSystem:51-57` - 检查材质缓存和配置有效性
2. **材质实例化**: `MaterialSystem:59-91` - 创建THREE.MeshStandardMaterial实例
3. **纹理加载**: `MaterialSystem:121-142` - 异步加载纹理并设置属性
4. **缓存管理**: `MaterialSystem:90-92` - 缓存材质实例和配置

### 材质更新流程（改进版）

1. **配置自动创建**: `MaterialSystem:150-159` - 支持自动创建材质配置，无需预先定义
2. **配置更新**: `MaterialSystem:147-156` - 更新材质配置状态，支持增量更新
3. **PBRVisualizer集成**: `PBRVisualizer:466-472` - 先更新材质配置，再应用到模型
4. **应用更新**: `MaterialSystem:166-206` - 遍历场景对象更新材质属性
5. **标记更新**: `MaterialSystem:203` - 设置material.needsUpdate触发GPU同步

### 材质编辑器流程

1. **MaterialEditor类**: `sdk-simple.ts:80-285` - 独立的材质编辑器封装类，集成Debug功能
2. **初始化**: `sdk-simple.ts:91-172` - 创建MaterialEditor实例和PBRVisualizer
3. **参数更新**: `sdk-simple.ts:204-239` - 转换参数并调用visualizer.updateModel
4. **错误处理**: `sdk-simple.ts:210-243` - 完善的错误处理和调试信息输出

### MaterialEditor Debug流程

1. **Debug模式切换**: `sdk-simple.ts:351-366` - toggleDebug()智能切换Debug状态并更新UI
2. **灯光Helper控制**: `sdk-simple.ts:371-394` - toggleLightHelpers()自动启用Debug并控制Helper显示
3. **Buffer模式循环**: `sdk-simple.ts:399-428` - cycleBufferMode()循环切换SSAO Buffer模式，支持中文显示
4. **全局函数绑定**: `sdk-simple.ts:463-481` - window对象绑定debug函数，支持HTML直接调用

### 性能优化流程

1. **模型优化**: `MaterialSystem:211-253` - 自动优化模型材质属性
2. **纹理优化**: `MaterialSystem:134-136` - 设置各向异性过滤提升采样质量
3. **资源清理**: `MaterialSystem:390-413` - 清理未使用的纹理资源
4. **内存统计**: `MaterialSystem:363-385` - 监控材质和纹理内存使用

### 预设系统流程

1. **预设定义**: `MaterialSystem:268-320` - 内置材质预设（金属、塑料、木材、玻璃、织物、陶瓷）
2. **变体创建**: `MaterialSystem:329-358` - 基于配置生成材质变体
3. **预设应用**: `sdk-simple.ts:244-262` - 通过applyPreset()快速应用预设配置

## 4. 设计原则

### 物理基础渲染

- **PBR理论**: 基于物理的光照模型，支持粗糙度(Roughness)和金属度(Metalness)
- **能量守恒**: 材质反射率和透射率遵循物理规律
- **真实感**: 基于实材质扫描参数，确保视觉真实性

### 模块化架构

- **分离设计**: 材质编辑器逻辑独立于HTML文件，提高可维护性
- **类型安全**: 完整的TypeScript类型系统，提供编译时检查
- **错误处理**: 完善的错误处理和调试信息输出
- **自动配置**: 支持自动创建材质配置，降低使用复杂度

### 纹理映射系统

- **法线贴图**: normalMap提供表面细节，支持normalScale缩放
- **环境遮蔽**: aoMap和aoMapIntensity控制阴影效果
- **金属粗糙度**: metallicRoughnessMap统一控制金属度和粗糙度
- **自发光**: emissiveMap和emissiveIntensity支持发光效果
- **透明材质**: transmission, transparent, opacity支持玻璃等透射材质

### 缓存和优化策略

- **智能缓存**: 基于配置哈希的材质缓存，避免重复创建
- **纹理复用**: 相同URL的纹理实例共享，减少内存占用
- **各向异性**: 根据硬件能力设置最优各向异性过滤级别
- **延迟加载**: 纹理按需加载，支持异步加载和缓存

### 材质状态管理

- **不可变更新**: 材质更新通过新配置对象，确保状态一致性
- **批量更新**: 支持多材质参数批量更新，提高性能
- **版本控制**: 材质配置变更可追踪，支持撤销重做
- **自动创建**: 无需预先定义材质配置，支持动态创建和增量更新
- **PBRVisualizer集成**: 统一的状态管理，材质更新通过事务系统处理

## 5. 关键特性

### 多材质类型支持

- **标准材质**: MeshStandardMaterial，用于大多数PBR材质
- **物理材质**: MeshPhysicalMaterial，支持玻璃等透射材质（新增透明材质支持）
- **预设材质**: 内置金属、塑料、木材、玻璃、织物、陶瓷等预设

### 材质编辑器特性

- **独立封装类**: MaterialEditor类完全独立，支持TypeScript模块化开发
- **类型安全**: MaterialParams和MaterialPreset接口提供完整的类型安全
- **错误处理**: 完善的try-catch机制和详细的调试信息输出
- **参数验证**: 增量参数更新，只处理有效参数值

### 纹理映射类型

- **基础颜色**: color和colorMap提供基础色彩
- **法线信息**: normalMap提供表面凹凸效果
- **环境遮蔽**: aoMap控制接触阴影
- **自发光**: emissiveMap实现发光效果
- **金属粗糙度**: metallicRoughnessMap统一控制反射属性
- **透明材质**: transmission, transparent, opacity支持玻璃等透射材质

### 性能监控

- **缓存统计**: 实时监控缓存材质数量和纹理数量
- **内存管理**: 估算纹理内存使用量，支持资源清理
- **性能优化**: 自动优化材质属性，提升渲染性能
- **调试信息**: 详细的控制台输出，便于问题诊断

### 材质变体系统

- **快速变体**: 基于基础配置生成粗糙、光滑、金属、哑光变体
- **预览支持**: 支持材质预览和对比功能
- **参数插值**: 支持材质参数的平滑过渡动画
- **动态更新**: 支持实时参数调整和预览

这个PBR材质系统通过基于物理的渲染模型、高效的缓存策略、灵活的预设系统和模块化的材质编辑器，为产品可视化提供了专业级的材质渲染能力。
