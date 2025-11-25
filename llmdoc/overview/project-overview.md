# PBR Visualizer SDK - 项目概览

## 项目简介

**PBR Visualizer SDK** 是一个专业级的3D渲染SDK,专注于物理基础渲染(Physically Based Rendering, PBR)和产品可视化。它提供了分层状态管理、照片级真实感渲染以及动态环境系统,适用于电商产品配置器、3D展示和交互式可视化场景。

## 核心定位

### 主要功能
- **物理精确渲染**: 基于Three.js的PBR渲染管线,支持PMREM(Prefiltered Mipmap Radiance Environment Map)环境映射
- **分层状态管理**: 支持全局状态和模型级状态的独立管理,实现复杂产品配置
- **动态环境系统**: 程序化生成的环境贴图,支持HDR环境和噪波球体
- **事务操作**: 完整的撤销/重做功能,支持批量状态更新
- **自适应质量**: 根据设备性能自动调整渲染质量
- **框架集成**: 提供React hooks和组件支持

### 目标场景
- 电商产品配置器(汽车、家具、服装等)
- 3D产品展示和交互式可视化
- 建筑和室内设计可视化
- 任何需要高质量3D渲染的Web应用

## 技术栈

### 核心依赖
- **Three.js** (^0.181.2): 核心3D渲染引擎
- **postprocessing** (^6.33.4): 后处理效果库

### 开发工具链
- **TypeScript** (^5.4.5): 类型安全的开发体验
- **Vite** (^4.5.3): 现代化的构建工具和开发服务器
- **Rollup** (^2.79.1): 库打包和优化
- **pnpm**: 高效的包管理器

### 代码质量工具
- **ESLint**: 代码静态检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Husky + lint-staged**: Git hooks和提交前检查
- **Commitlint**: 提交信息规范

## 项目架构演进

### 重大重构历史

根据Git提交历史,项目经历了以下重要演进:

1. **初始阶段** (初期提交)
   - 项目定位为"3D模型转换SDK"
   - 包含AssimpJS相关的WASM模块

2. **重构为PBR可视化器** (b4cc802)
   - 从模型转换工具转型为PBR可视化SDK
   - 建立核心渲染管线和状态管理系统

3. **核心模块重构** (41cf759, b561d08, ae05de1)
   - 移除核心类文件:
     - `src/core/Emitter.ts`
     - `src/core/EnvironmentSystem.ts`
     - `src/core/LightManager.ts`
     - `src/core/ModelManager.ts`
     - `src/core/PBRVisualizer.ts`
     - `src/core/PMREMGenerator.ts`
     - `src/core/PostProcessor.ts`
     - `src/core/QualityDetector.ts`
     - `src/core/Ray.ts`
     - `src/core/Renderer.ts`
     - `src/core/ShadowSystem.ts`
     - `src/core/StateMachine.ts`
     - `src/shaders/DynamicNoiseSphere.ts`
     - `src/shaders/EquirectToCubeUV.ts`
     - `src/shaders/SphericalGaussianBlur.ts`
     - `src/react/PBRVisualizer.tsx`
     - `src/react/useVisualizer.ts`
     - `src/types/core.ts`
   - 将LightManager重构为函数式
   - 优化模块结构和类型定义

4. **当前状态** (最新)
   - 核心代码大幅简化,仅保留 `src/index.ts`
   - 架构文档和着色器规范已在 `docs/` 中定义
   - Demo实现已迁移到 `demo/` 目录

### 当前项目状态

**重要**: 根据 `.trae/documents/重构渲染管线与着色器集成方案.md`,项目正处于重构阶段:

- **目标**: 以 `docs/shader.md` 和 `docs/shader.ts` 为规范,统一并修正渲染逻辑与着色器实现
- **问题**: 文档与实现脱节,着色器未模块化,环境系统职责重复
- **方向**: 模块化着色器、统一环境系统、对齐文档规范

## 构建输出

### 包结构
```json
{
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.mjs",
      "types": "./dist/react/index.d.ts"
    }
  }
}
```

### 发布配置
- **包名**: `@sruim/pbr-visualizer-sdk`
- **版本**: 1.0.0
- **许可证**: MIT
- **注册表**: npm公共注册表

## 开发工作流

### 主要命令
- `pnpm dev`: 启动Vite开发服务器(自动打开demo页面)
- `pnpm build`: 构建库文件
- `pnpm preview`: 预览构建结果
- `pnpm lint`: 运行ESLint检查
- `pnpm check:ts`: TypeScript类型检查

### 质量保证
- Git提交前自动运行ESLint和TypeScript检查
- Commit message遵循Conventional Commits规范
- 类型定义自动生成到 `dist/types/`

## 文档资源

### 现有文档
- `README.md`: 快速开始和基本API
- `docs/架构.md`: 详细的系统架构设计(包含性能指标和商业价值)
- `docs/shader.md`: 三个核心着色器的完整GLSL规范
- `docs/shader.ts`: 着色器TypeScript实现
- `.trae/documents/`: 技术重构方案

### Demo示例
- `demo/html/ai_studio_code.html`: Cinematic PBR Studio演示
- `demo/html/pbr-demo.html`: PBR可视化器演示
- `demo/html/single.html`: 单模型演示

## 关键概念

本项目围绕以下核心概念构建:

1. **渲染管线**: PBR材质、PMREM环境映射、自定义着色器、后处理
2. **状态管理**: 分层状态系统、事务操作、撤销/重做
3. **环境光照**: 动态环境、HDR支持、程序化生成、灯光系统
4. **性能优化**: 自适应质量、资源管理、设备检测

详细文档请参阅对应的architecture和guides目录。
