# PBR Visualizer SDK 文档

欢迎查阅PBR Visualizer SDK的LLM优化文档系统。本文档系统旨在帮助AI助手和开发者快速理解项目架构、使用方法和最佳实践。

## 文档结构

本文档系统按照以下层次组织:

### 📖 Overview - 项目概览

高层次的项目介绍和背景信息。**从这里开始**了解项目。

- **[project-overview.md](overview/project-overview.md)** - 项目简介、技术栈、架构演进和关键概念

### 🗺️ Architecture - 架构文档

系统设计和"LLM检索地图",回答"它是如何工作的?"

- **[rendering-pipeline.md](architecture/rendering-pipeline.md)** - 四阶段渲染管线、着色器系统、PMREM生成
- **[state-management.md](architecture/state-management.md)** - 分层状态系统、事务操作、撤销/重做机制
- **[environment-lighting.md](architecture/environment-lighting.md)** - HDR环境、程序化环境、灯光系统、IBL

### 📚 Guides - 操作指南

分步骤的操作说明,回答"如何做X?"

- **[rendering-setup.md](guides/rendering-setup.md)** - 渲染管线配置、环境设置、材质配置、后处理

### 📋 Reference - 参考资料

详细的事实查询信息,回答"X的细节是什么?"

- **[coding-conventions.md](reference/coding-conventions.md)** - TypeScript/ESLint/Prettier规范、命名约定、最佳实践
- **[git-conventions.md](reference/git-conventions.md)** - Conventional Commits、分支策略、Git工作流

## 快速导航

### 我是新手,想快速了解项目

1. 阅读 **[project-overview.md](overview/project-overview.md)** 了解项目定位和核心特性
2. 查看 **[rendering-pipeline.md](architecture/rendering-pipeline.md)** 理解渲染流程
3. 参考 **[rendering-setup.md](guides/rendering-setup.md)** 开始配置

### 我要实现具体功能

**配置环境光照**:
- [rendering-setup.md § 环境配置](guides/rendering-setup.md#环境配置)
- [environment-lighting.md](architecture/environment-lighting.md)

**管理模型状态**:
- [state-management.md § 使用模式](architecture/state-management.md#使用模式)
- [state-management.md § StateMachine类](architecture/state-management.md#statemachine类)

**调整材质效果**:
- [rendering-setup.md § 材质配置](guides/rendering-setup.md#材质配置)
- [rendering-pipeline.md § 阶段3: PBR主渲染](architecture/rendering-pipeline.md#阶段3-pbr主渲染)

**优化性能**:
- [rendering-setup.md § 渲染优化技巧](guides/rendering-setup.md#渲染优化技巧)
- [rendering-pipeline.md § 性能优化](architecture/rendering-pipeline.md#性能优化)
- [state-management.md § 性能优化](architecture/state-management.md#性能优化)

**实现撤销/重做**:
- [state-management.md § 事务操作](architecture/state-management.md#事务操作)
- [state-management.md § 撤销/重做](architecture/state-management.md#撤销重做)

### 我要贡献代码

**了解代码规范**:
- [coding-conventions.md](reference/coding-conventions.md) - 完整的编码规范
- [git-conventions.md](reference/git-conventions.md) - Git提交约定

**了解项目结构**:
- [project-overview.md § 项目架构演进](overview/project-overview.md#项目架构演进)
- [project-overview.md § 构建输出](overview/project-overview.md#构建输出)

**理解重构方向**:
- [rendering-pipeline.md § 当前重构状态](architecture/rendering-pipeline.md#当前重构状态)
- 参考项目根目录: `.trae/documents/重构渲染管线与着色器集成方案.md`

## 核心概念速查

### 渲染相关

- **PBR (Physically Based Rendering)**: 物理基础渲染,使用物理准确的光照和材质模型
- **PMREM (Prefiltered Mipmap Radiance Environment Map)**: 预过滤的环境贴图,用于IBL
- **IBL (Image-Based Lighting)**: 基于图像的光照,使用环境贴图照亮场景
- **HDR (High Dynamic Range)**: 高动态范围,支持更大的亮度范围
- **ACES**: 电影级色调映射算法
- **SSAO**: 屏幕空间环境光遮蔽,增强深度感

### 着色器

- **DynamicNoiseSphere**: 程序化噪波球体着色器,生成动态背景
- **EquirectangularToCubeUV**: 全景图到立方体贴图转换着色器
- **SphericalGaussianBlur**: 球面高斯模糊着色器,用于PMREM

### 状态管理

- **Global State**: 全局状态,影响整个场景(环境、相机、后处理)
- **Model State**: 模型状态,每个模型独立的属性(材质、变换)
- **Transaction**: 事务,记录状态变更的单位
- **StateMachine**: 状态机,管理状态转换和历史

### 材质属性

- **color**: 基础颜色
- **roughness**: 粗糙度 (0=镜面, 1=漫反射)
- **metalness**: 金属度 (0=非金属, 1=金属)
- **envMapIntensity**: 环境反射强度

## 相关外部文档

项目还包含以下传统文档:

- **[README.md](../README.md)** - 项目介绍和快速开始
- **[docs/架构.md](../docs/架构.md)** - 详细的系统架构设计(中文,包含性能指标和商业价值)
- **[docs/shader.md](../docs/shader.md)** - 三个核心着色器的完整GLSL规范
- **[docs/shader.ts](../docs/shader.ts)** - 着色器TypeScript实现代码
- **[.trae/documents/重构渲染管线与着色器集成方案.md](../.trae/documents/重构渲染管线与着色器集成方案.md)** - 当前重构计划

## 示例代码

Demo示例位于 `demo/` 目录:

- **demo/html/ai_studio_code.html** - Cinematic PBR Studio演示(动态blob shadow + SSAO)
- **demo/html/pbr-demo.html** - PBR可视化器演示
- **demo/html/single.html** - 单模型演示

## 开发命令

```bash
# 开发服务器(自动打开demo)
pnpm dev

# 构建库
pnpm build

# 代码检查
pnpm lint

# TypeScript类型检查
pnpm check:ts

# 预览构建结果
pnpm preview
```

## 项目状态

**当前版本**: 1.0.0

**重要提示**: 项目正处于重构阶段,目标是统一文档规范与代码实现。核心模块已大幅简化,许多原有类已被移除或重构为函数式。详见:

- [project-overview.md § 项目架构演进](overview/project-overview.md#项目架构演进)
- [rendering-pipeline.md § 当前重构状态](architecture/rendering-pipeline.md#当前重构状态)

## 技术栈概览

- **核心渲染**: Three.js (^0.181.2)
- **后处理**: postprocessing (^6.33.4)
- **类型系统**: TypeScript (^5.4.5)
- **构建工具**: Vite + Rollup
- **包管理**: pnpm
- **代码质量**: ESLint + Prettier + Husky

## 贡献指南

1. **阅读规范**:
   - [coding-conventions.md](reference/coding-conventions.md)
   - [git-conventions.md](reference/git-conventions.md)

2. **了解架构**:
   - [rendering-pipeline.md](architecture/rendering-pipeline.md)
   - [state-management.md](architecture/state-management.md)
   - [environment-lighting.md](architecture/environment-lighting.md)

3. **提交代码**:
   - 遵循Conventional Commits规范
   - 确保通过ESLint和TypeScript检查
   - 添加适当的测试和文档

## 许可证

MIT License - 详见项目根目录 [LICENSE](../LICENSE) 文件

---

**文档版本**: 1.0
**最后更新**: 2025-11-25
**维护者**: Sruim

如有问题或建议,请提交Issue或Pull Request。
