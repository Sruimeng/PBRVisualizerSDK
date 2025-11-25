# PBR Visualizer SDK 文档索引

## 📋 概述 (Overview)

**[PBR Visualizer SDK 项目概览](overview/project-overview.md)** - 项目介绍、目标和技术栈
- 专业级基于Three.js的PBR可视化SDK
- 多模型状态管理和高性能WebGL渲染管线
- 完整的事务系统和撤销/重做功能
- 支持HDR环境、Studio布光、后处理效果

**[核心特性概览](overview/core-features.md)** - 主要功能和技术特色
- 模块化架构：外观模式、策略模式、观察者模式
- 类型安全：完整的TypeScript类型系统（343行）
- 性能优化：多级缓存机制、自适应质量调节
- 扩展性：支持自定义着色器和系统扩展

## 🏗️ 架构设计 (Architecture)

**[核心渲染系统](architecture/core-rendering-system.md)** - PBR主类设计和核心系统架构
- PBRVisualizer统一门面设计（728行）
- WebGL渲染器配置和性能监控
- 渲染循环管理和场景图管理

**[状态管理架构](architecture/state-management.md)** - 事务系统和多模型状态
- 基于事务模式的分层状态管理
- 支持撤销/重做的完整历史记录
- 多模型并发更新和事务合并

**[PBR材质系统](architecture/pbr-material-system.md)** - PBR材质的设计和实现
- 基于物理的材质渲染引擎
- 材质缓存和纹理管理系统
- 内置材质预设（金属、塑料、木材、玻璃、织物）

## 📖 操作指南 (Guides)

**[快速开始](guides/quick-start.md)** - 5分钟快速上手
- 基础初始化和配置
- 第一个模型加载和渲染

**[API初始化配置](guides/api-setup.md)** - SDK初始化和基础配置
- 构造函数选项详解
- 全局状态配置
- 质量和调试设置

**[API使用模式](guides/api-usage.md)** - 模型、环境、后处理等API使用模式
- 模型加载和管理
- 材质参数实时更新
- 环境配置和切换

**[基础渲染工作流](guides/basic-rendering-workflow.md)** - 创建和配置3D场景
- 场景构建流程
- 相机控制和配置
- 基础渲染循环

**[状态更新基础](guides/state-updates-basics.md)** - 单模型状态管理
- 模型状态更新操作
- 可见性控制和位置变换
- 安全的状态更新机制
- 事务系统集成

**[事务基础操作](guides/transaction-basics.md)** - 事务系统基础功能
- 单模型事务更新
- 批量事务更新
- 撤销/重做操作
- 状态快照获取

**[事务事件系统](guides/transaction-events.md)** - 事件监听和处理
- 状态变更事件
- 撤销/重做事件
- 错误处理机制
- UI集成示例

**[高级事务功能](guides/transaction-advanced.md)** - 事务系统高级用法
- 带描述的事务操作
- 智能事务合并
- 性能优化策略
- 完整事务管理系统

**[事务持久化](guides/transaction-persistence.md)** - 状态保存和恢复
- 本地存储状态
- 状态快照管理
- 事务历史管理
- 状态系统优化

**[材质和光照配置](guides/material-and-lighting-configuration.md)** - PBR材质和高级光照设置
- PBR材质参数详解
- Studio三点布光系统
- 材质预设应用

**[PBR材质创建工作流](guides/pbr-material-creation-workflow.md)** - 材质创建、配置和优化指南
- 材质创建流程
- 纹理映射配置
- 材质性能优化

**[环境系统](guides/environment-system.md)** - 使用HDR环境和程序化布光
- HDR环境贴图加载
- Studio三点布光配置
- 程序化环境生成

**[后处理效果](guides/post-processing.md)** - SSAO、Bloom等效果配置
- SSAO接触阴影设置
- Bloom泛光效果配置
- 色调映射和抗锯齿

## 📚 参考资料 (Reference)

**[API概要](reference/api-summary.md)** - 核心API和配置接口概要
- 主要API接口清单
- 配置选项和参数说明
- 返回值和事件类型

**[API使用示例](reference/api-examples.md)** - 完整的API使用示例和最佳实践
- 基础初始化示例
- 材质配置示例
- 环境和后处理配置

**[类型系统参考](reference/type-system-reference.md)** - 完整的TypeScript类型定义
- 完整的类型层次结构
- 接口定义和使用说明
- 类型约束和验证规则

**[代码示例](reference/code-examples.md)** - 常用功能的代码示例
- 完整使用示例
- 错误处理模式
- 性能优化实践

**[编码约定](reference/coding-conventions.md)** - TypeScript、ESLint、Prettier规范
- 代码风格指南
- 命名约定和最佳实践
- ESLint规则配置

**[Git约定](reference/git-conventions.md)** - Git工作流程和提交信息规范
- 提交信息格式
- 分支管理策略
- 代码审查流程

**[配置文件](reference/configuration-files.md)** - 构建和开发工具配置
- TypeScript配置详解
- 构建工具配置（Vite + Rollup）
- 代码质量工具配置

## 🤖 智能分析报告 (Agent Analysis)

**[PBR渲染核心实现分析](agent/PBR渲染核心实现分析报告.md)** - 渲染系统技术深度分析
- 当前项目实现状态评估
- 核心功能模块差距分析
- 实现建议和重构方向

**[API设计分析](agent/PBRVisualizer_SDK_API设计分析报告.md)** - 接口设计和使用模式分析
- 完整API接口设计文档
- 初始化和配置方式详解
- 事件系统和回调机制

**[核心实现深度分析](agent/PBRVisualizerSDK核心实现深度分析报告.md)** - 系统架构和实现细节分析
- 核心系统实现分析
- 渲染管线工作流程
- 性能优化机制详解

---

## 📊 文档统计

- **总文档数**: 27个
- **架构文档**: 3个
- **指南文档**: 13个
- **参考文档**: 8个
- **分析报告**: 3个
- **代码示例**: 包含完整的使用示例和最佳实践

## 🔗 快速导航

- **新手入门**: [快速开始](guides/quick-start.md) → [API初始化配置](guides/api-setup.md) → [基础渲染工作流](guides/basic-rendering-workflow.md)
- **深度学习**: [项目概览](overview/project-overview.md) → [核心渲染系统](architecture/core-rendering-system.md) → [状态管理架构](architecture/state-management.md)
- **问题解决**: [API使用示例](reference/api-examples.md) → [代码示例](reference/code-examples.md) → [智能分析报告](agent/)
- **架构设计**: [PBR材质系统](architecture/pbr-material-system.md) → [环境系统](guides/environment-system.md) → [后处理效果](guides/post-processing.md)