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
- 材质状态管理和事务系统集成

**[状态管理架构](architecture/state-management.md)** - 事务系统和多模型状态
- 基于事务模式的分层状态管理
- 支持撤销/重做的完整历史记录
- 多模型并发更新和事务合并

**[PBR材质系统](architecture/pbr-material-system.md)** - PBR材质的设计和实现
- 基于物理的材质渲染引擎
- 材质缓存和纹理管理系统
- 内置材质预设（金属、塑料、木材、玻璃、织物）
- 自动材质配置创建和增量更新
- 独立的MaterialEditor材质编辑器类

**[PostProcessSystem 后处理系统](architecture/post-processing-system.md)** - 后处理渲染管线架构
- EffectComposer管理和条件渲染机制
- SSAO、Bloom、色调映射效果控制
- 初始化同步和运行时性能优化
- 模块化效果管理和性能监控集成

**[Debug系统架构](architecture/debug-system.md)** - 调试框架和可视化工具
- 灯光Helper可视化（4种Helper类型）
- Buffer可视化调试（5种输出模式）
- lil-gui集成的实时调试面板
- 性能监控集成

## 📖 操作指南 (Guides)

**[快速开始](guides/quick-start.md)** - 5分钟快速上手
- 基础初始化和配置
- 第一个模型加载和渲染

**[材质编辑器使用指南](guides/material-editor-usage.md)** - 专业材质编辑器使用教程
- 材质参数实时调节
- 6种材质预设应用
- 性能优化和监控

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

**[PBR材质创建工作流](guides/pbr-material-creation-workflow.md)** - 材质创建、配置和优化指南
- 材质创建流程
- 纹理映射配置
- 材质性能优化

**[PBR材质优化和缓存](guides/pbr-material-optimization-and-caching.md)** - 材质性能优化和缓存策略
- 材质性能优化技术
- 缓存机制和内存管理
- 渲染质量调节

**[基础使用指南](guides/basic-usage.md)** - SDK基础使用方法
- 基本API使用方法
- 常见操作流程
- 错误处理和调试

**[SDK设置指南](guides/sdk-setup.md)** - SDK开发环境设置
- 开发环境配置
- 项目结构说明
- 构建和部署流程

**[Debug模式使用指南](guides/debug-mode-usage.md)** - 调试工具使用教程
- 灯光Helper可视化调试
- Buffer输出模式调试
- 性能监控和优化
- lil-gui面板控制

## 📚 参考资料 (Reference)

**[API概要](reference/api-summary.md)** - 核心API和配置接口概要
- 主要API接口清单
- 配置选项和参数说明
- 返回值和事件类型

**[API使用示例](reference/api-examples.md)** - 完整的API使用示例和最佳实践
- 基础初始化示例
- 材质配置示例
- 环境和后处理配置

**[配置文件](reference/configuration-files.md)** - 构建和开发工具配置
- TypeScript配置详解
- 构建工具配置（Vite + Rollup）
- 代码质量工具配置

**[代码示例](reference/code-examples.md)** - 常用功能的代码示例
- 完整使用示例
- 错误处理模式
- 性能优化实践
- 材质编辑器高级示例

**[Demo系统状态](reference/demo-system-status.md)** - 演示系统资源文件和状态信息
- 完整资源文件清单
- 3D模型和HDR环境贴图信息
- 演示文件访问路径
- SDK功能验证指南

**[编码约定](reference/coding-conventions.md)** - TypeScript、ESLint、Prettier规范
- 代码风格指南
- 命名约定和最佳实践
- ESLint规则配置

**[Git约定](reference/git-conventions.md)** - Git工作流程和提交信息规范
- 提交信息格式
- 分支管理策略
- 代码审查流程

**[示例](reference/examples.md)** - 完整的使用示例和最佳实践
- 完整使用示例
- 错误处理模式
- 性能优化实践

## 🤖 智能分析报告 (Agent Analysis)

**[PBRVisualizer SDK Demo实现全面分析报告](agent/PBRVisualizer_SDK_Demo实现全面分析报告.md)** - Demo实现技术深度分析
- Demo实现状态评估
- 核心功能模块分析
- 实现建议和优化方向

**[demo目录更新分析报告](agent/demo目录更新分析报告.md)** - Demo目录结构和更新分析
- 目录结构优化分析
- 功能模块更新评估
- 实现改进建议

**[PBR Visualizer初始化修复分析](agent/pbr-visualizer-init-fix.md)** - 初始化问题修复分析
- 初始化问题诊断
- 修复方案实现
- 性能优化建议

**[SDK Demo执行失败分析](agent/sdk-demo-execution-failure-analysis.md)** - 执行失败问题分析
- 执行失败原因分析
- 问题诊断和解决方案
- 系统稳定性优化

**[PBR Visualizer SDK 综合技术分析报告](agent/pbr-visualizer-sdk-comprehensive-analysis.md)** - 项目完整技术状态和成熟度评估
- 核心架构和技术栈深度分析
- 功能模块完成度和性能评估
- 生产环境就绪度和技术债务分析

**[Demo实现状态分析报告](agent/demo-implementation-analysis.md)** - 演示系统功能完整性和技术实现质量评估
- Demo系统目录结构和功能覆盖度分析
- 技术实现质量和用户体验评估
- 改进建议和优化方向

**[功能对齐调查报告](agent/feature-alignment-investigation.md)** - 后处理系统和灯光系统与参考实现的对比分析
- PostProcessSystem初始化问题诊断和修复方案
- 灯光系统完整性和三点布光实现验证
- 渲染循环流程与参考实现对比分析

**[Demo运行时调查报告](agent/demo-runtime-investigation.md)** - Demo文件运行环境配置和问题分析
- TypeScript文件导入和Vite开发服务器配置分析
- 路径别名解析和生产环境部署配置
- 完整的开发和生产运行指南

---

## 📊 文档统计

- **总文档数**: 40个（含索引）
- **概述文档**: 2个
- **架构文档**: 5个（新增Debug系统）
- **指南文档**: 16个（新增Debug模式使用）
- **参考文档**: 8个
- **分析报告**: 8个
- **代码示例**: 包含完整的使用示例和最佳实践
- **源代码**: 3,261行TypeScript代码
- **类型定义**: 343行完整类型系统

## 🔗 快速导航

- **新手入门**: [快速开始](guides/quick-start.md) → [材质编辑器使用指南](guides/material-editor-usage.md) → [API初始化配置](guides/api-setup.md)
- **深度学习**: [项目概览](overview/project-overview.md) → [核心渲染系统](architecture/core-rendering-system.md) → [状态管理架构](architecture/state-management.md)
- **问题解决**: [API使用示例](reference/api-examples.md) → [代码示例](reference/code-examples.md) → [Demo系统状态](reference/demo-system-status.md) → [功能对齐调查报告](agent/feature-alignment-investigation.md) → [智能分析报告](agent/)
- **材质设计**: [材质编辑器使用指南](guides/material-editor-usage.md) → [材质和光照配置工作流程](guides/material-and-lighting-configuration.md) → [PBR材质系统](architecture/pbr-material-system.md)
- **开发调试**: [Debug模式使用指南](guides/debug-mode-usage.md) → [Debug系统架构](architecture/debug-system.md) → [Demo运行时调查报告](agent/demo-runtime-investigation.md) → [编码约定](reference/coding-conventions.md) → [Git约定](reference/git-conventions.md)