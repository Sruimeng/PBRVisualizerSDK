# Git工作流程约定

## 1. 核心摘要

项目使用基于Conventional Commits的Git工作流程，结合husky钩子进行代码质量检查。分支管理采用Git Flow模式，提交信息遵循严格的规范格式。

## 2. 源码配置

### 2.1 Git配置
- **主分支**: `main`
- **提交规范**: Conventional Commits
- **代码审查**: Pull Request流程

### 2.2 关键配置文件
- **提交规范**: `commitlint.config.cjs` - 使用`@commitlint/config-conventional`
- **代码检查**: `.lintstagedrc.json` - 针对TypeScript文件的ESLint检查
- **忽略规则**: `.gitignore` - 排除构建产物、依赖、IDE配置等

### 2.3 Hook配置
- **准备阶段**: `package.json`中配置`"prepare": "husky install"`
- **依赖包**: husky@7.0.4, commitlint@19.3.0, lint-staged@11.2.6

## 3. 提交信息规范

### 3.1 类型约定
- **feat**: 新功能
- **fix**: Bug修复
- **refactor**: 代码重构
- **style**: 代码格式调整
- **chore**: 构建或工具相关修改
- **docs**: 文档更新

### 3.2 格式规范
```
<type>(<scope>): <description>

[body]

[footer]
```

### 3.3 示例
- `feat: 实现PBR可视化SDK核心系统`
- `fix(vercel): 修正ai_studio_code.html的重定向路径`
- `style: 修改轮廓光颜色为暖色调`

## 4. 工作流程

### 4.1 开发流程
1. 创建功能分支从`main`拉取
2. 开发完成后提交更改（遵循提交规范）
3. 提交时自动运行lint检查和类型检查
4. 创建Pull Request到`main`分支
5. 代码审查通过后合并

### 4.2 质量保证
- **Pre-commit Hook**: 执行lint-staged检查
- **ESLint**: 代码风格和错误检查
- **TypeScript**: 类型检查 (`tsc -b tsconfig.check.json`)
- **Commitlint**: 提交信息格式验证

## 5. 发布流程

- 使用`pnpm build:module`进行构建
- 通过`prepublishOnly`脚本确保代码质量
- 发布到NPM Registry (public access)

## 6. Source of Truth

- **Git配置**: `/package.json:47,60-84` - husky和commitlint依赖配置
- **提交规范**: `/commitlint.config.cjs:1` - Conventional Commits配置
- **Lint配置**: `/.lintstagedrc.json:2-6` - TypeScript文件检查规则
- **忽略规则**: `/.gitignore:1-23` - 版本控制忽略规则
- **相关架构**: `/llmdoc/reference/coding-conventions.md` - 编码规范文档