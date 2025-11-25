# Git提交约定

本文档描述PBR Visualizer SDK项目的Git工作流程和提交规范。

## 提交信息规范

### Conventional Commits

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范,通过commitlint强制执行。

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

根据项目提交历史,常用类型包括:

- **feat**: 新功能
  ```
  feat(渲染): 添加高精度PMREM选项并优化环境贴图生成
  feat: 添加React组件支持与阴影系统
  ```

- **refactor**: 代码重构(不改变外部行为)
  ```
  refactor(core): 将 LightManager 类重构为 createLights 函数
  refactor(core): 重构核心模块结构并优化类型定义
  ```

- **chore**: 构建过程或辅助工具的变动
  ```
  chore: 更新vite配置,添加服务器和预览设置并修正dts输出目录
  chore: 清理demo/glb目录中的旧模型文件
  ```

- **style**: 代码格式调整(不影响代码逻辑)
  ```
  style(ai_studio_code): 更新模型路径并添加flatShading材质属性
  ```

- **fix**: Bug修复
  ```
  fix(renderer): 修复PMREM生成时的内存泄漏
  ```

- **docs**: 文档更新
  ```
  docs: 更新API文档和使用示例
  ```

- **test**: 添加或修改测试
  ```
  test(state): 添加状态管理单元测试
  ```

- **perf**: 性能优化
  ```
  perf(renderer): 优化渲染循环,减少GC压力
  ```

### Scope范围

Scope用于指明提交影响的模块或领域,常见scope包括:

- `core`: 核心模块
- `types`: 类型定义
- `renderer` / `渲染` / `渲染器`: 渲染相关
- `state`: 状态管理
- `demo`: 示例代码
- `config` / `配置`: 配置文件
- `灯光管理`: 灯光系统
- `ModelManager`: 模型管理器

Scope可选,但建议添加以提高可读性。

### Subject主题

- 使用简洁的描述性语句
- 支持中文和英文
- 不要以句号结尾
- 使用祈使语气 ("添加"而非"添加了")

### 多模块提交

当一次提交影响多个模块时,可以使用多个type组合:

```
feat(types): 添加ControlState接口到核心类型
refactor(ModelManager): 简化模型加载逻辑并移除未使用的导入
style(ai_studio_code): 更新模型路径并添加flatShading材质属性
chore: 清理demo/glb目录中的旧模型文件
```

## 提交流程

### 1. 暂存更改

```bash
git add <files>
```

### 2. 提交

```bash
git commit -m "feat(renderer): 添加新的后处理效果"
```

### 3. 自动检查

提交时会自动触发:

1. **lint-staged**: 对暂存的 `.ts` 文件运行
   - ESLint自动修复
   - TypeScript类型检查

2. **commitlint**: 验证提交信息格式
   - 检查type是否合法
   - 检查格式是否符合规范

### 4. 推送

```bash
git push origin <branch>
```

## 分支策略

### 主分支

- **main**: 主分支,稳定版本
  - 所有PR合并到main
  - 发布版本从main构建

### 功能分支

```bash
git checkout -b feat/new-feature
git checkout -b fix/bug-description
git checkout -b refactor/module-name
```

### 分支命名约定

- `feat/功能描述`: 新功能
- `fix/问题描述`: Bug修复
- `refactor/模块名`: 重构
- `docs/文档说明`: 文档更新

## Git Hooks配置

### Husky设置

项目使用Husky管理Git hooks:

```bash
# 安装hooks
pnpm prepare
```

### Pre-commit Hook

提交前自动运行:
- ESLint检查和自动修复
- TypeScript类型检查
- 仅检查暂存区文件

### Commit-msg Hook

验证提交信息:
- 使用 `@commitlint/config-conventional` 配置
- 确保符合Conventional Commits规范

## 提交最佳实践

### 1. 原子性提交

每次提交应该:
- 解决一个明确的问题
- 不破坏构建
- 包含相关的测试更新

```bash
# ✅ 推荐
git commit -m "feat(renderer): 添加PMREM缓存机制"

# ❌ 避免(混合多个不相关的更改)
git commit -m "feat: 添加缓存、修复Bug、更新文档"
```

### 2. 详细的提交信息

对于复杂的更改,使用body部分说明:

```
refactor(core): 重构环境系统架构

- 将EnvironmentSystem拆分为独立模块
- 移除重复的PMREM生成逻辑
- 统一HDR和噪波环境的处理流程

参考: .trae/documents/重构渲染管线与着色器集成方案.md
```

### 3. 使用Breaking Changes

重大变更需要在footer中标明:

```
feat(api): 重构updateModel API签名

BREAKING CHANGE: updateModel现在返回Promise<void>而非void,
调用时需要使用await或.then()
```

### 4. 关联Issue

如果使用Issue跟踪,在footer中关联:

```
fix(renderer): 修复材质更新时的内存泄漏

Closes #123
```

## 提交历史示例

项目近期提交历史示例:

```
feat(types): 添加ControlState接口到核心类型
refactor(core): 将 LightManager 类重构为 createLights 函数
feat(灯光管理): 扩展灯光系统支持多种灯光类型并添加默认配置
refactor(core): 重构核心模块结构并优化类型定义
feat(配置): 更新Vite和Vercel配置以支持demo页面自动打开
chore: 更新vite配置,添加服务器和预览设置并修正dts输出目录
refactor(core): 移除EnvironmentSystem并重构环境相关逻辑
feat: 添加React组件支持与阴影系统
feat(渲染): 添加高精度PMREM选项并优化环境贴图生成
feat(渲染器): 添加环境光强度配置支持
```

## 工具和资源

### Commitlint配置

```javascript
// commitlint.config.cjs
module.exports = { extends: ['@commitlint/config-conventional'] };
```

### 验证提交信息

手动验证提交信息格式:

```bash
echo "feat(renderer): 添加新功能" | npx commitlint
```

### 撤销提交

如果提交信息有误:

```bash
# 撤销最后一次提交,保留更改
git reset --soft HEAD~1

# 修改提交信息
git commit --amend -m "正确的提交信息"
```

## 常见问题

### Q: 提交被commitlint拒绝怎么办?

A: 检查提交信息格式:
- type必须是有效类型(feat, fix, refactor等)
- 格式必须是 `type(scope): subject`
- subject不能为空

### Q: 可以跳过Git hooks吗?

A: 不推荐,但紧急情况下可以使用 `--no-verify`:

```bash
git commit --no-verify -m "emergency fix"
```

### Q: 如何处理多文件修改?

A: 可以分多次提交,每次提交一个逻辑单元:

```bash
git add src/renderer.ts
git commit -m "refactor(renderer): 优化渲染循环"

git add src/state.ts
git commit -m "feat(state): 添加批量更新方法"
```
