# 编码约定参考

## 1. 核心摘要

本项目采用现代化的TypeScript开发栈，结合ESLint、Prettier和严格的TypeScript配置，确保代码质量和一致性。主要特色是单引号、强类型检查、React最佳实践和Conventional Commits规范。

## 2. 源文件参考

- **TypeScript配置**: `tsconfig.json` - 编译选项和路径映射
- **ESLint配置**: `eslint.config.js` - 代码质量规则和React设置
- **Prettier配置**: `.prettierrc` - 代码格式化规则
- **提交规范**: `commitlint.config.cjs` - Git提交信息规范
- **项目配置**: `package.json` - 脚本和依赖项配置

## 3. TypeScript 配置

### 严格模式类型检查

- **目标版本**: ES2020
- **模块系统**: ESNext + Node解析
- **严格检查**: 启用所有严格类型检查
- **未使用变量**: 禁止未使用的局部变量和参数
- **隐式返回**: 禁止函数中的隐式返回
- **switch穿透**: 禁止switch语句的case穿透

### 路径映射

```typescript
"paths": {
  "@/*": ["src/*"],
  "@sruim/pbr-visualizer-sdk": ["src/index.ts"]
}
```

### 编译选项

- **声明文件**: 生成.d.ts类型声明文件
- **输出目录**: ./dist
- **源码目录**: ./src
- **JSON模块**: 启用JSON模块解析
- **隔离模块**: 启用隔离模块支持

## 4. ESLint 规则

### 基础规则

- **单引号**: 强制使用单引号字符串
- **分号**: 强制使用分号语句结尾
- **空格注释**: 强制注释使用空格分隔
- **模板字符串**: 允许使用模板字符串

### React 规则

- **自闭合组件**: 强制使用自闭合组件标签
- **无prop-types**: 禁用React prop-types（使用TypeScript类型）
- **钩子规则**: 强制React钩子使用规则
- **依赖检查**: 钩子依赖项严格检查
- **组件名称**: 禁用组件名称显示（使用函数名）

### TypeScript 规则

- **类型导入**: 强制使用类型导入
- **前置定义**: 禁用前置定义
- **any类型**: 警告使用any类型
- **命名空间**: 禁用TypeScript命名空间
- **未使用表达式**: 错误级别的未使用表达式检查

### JSX可访问性

- **点击事件**: 禁用点击事件必须有键盘事件
- **静态元素**: 禁用静态元素交互
- **自动焦点**: 禁用自动焦点属性

## 5. Prettier 格式化

### 核心规则

- **单引号**: 使用单引号
- **分号**: 使用分号
- **尾随逗号**: 所有情况下使用尾随逗号
- **打印宽度**: 100字符

### 特殊处理

- **导入整理**: 使用prettier-plugin-organize-imports
- **JSON文件**: .prettierrc文件使用JSON解析器
- **Markdown文件**: 禁用Markdown中的嵌入式语言格式化

## 6. Git 工作流

### 提交规范

- **规范**: 遵循Conventional Commits规范
- **配置**: 使用@commitlint/config-conventional
- **验证**: 通过Husky pre-commit钩子验证

### 代码质量检查

- **ESLint**: `pnpm lint` 和 `pnpm lint:fix`
- **TypeScript**: `pnpm check:ts`
- **构建前清理**: `pnpm clean`

## 7. 项目约定

### 文件结构

- **源码**: ./src 目录
- **构建**: ./dist 目录
- **演示**: ./demo 目录（排除在构建外）
- **测试**: ./test 目录（已添加到.gitignore）

### 构建流程

- **开发**: Vite开发服务器
- **生产**: Rollup构建
- **文档**: Typedoc生成API文档
- **预览**: concurrently构建和预览

### 导出配置

- **模块**: ESM格式（.mjs）
- **React**: 分离的React包导出
- **类型**: 包含完整的TypeScript类型定义
