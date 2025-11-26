### Code Sections (The Evidence)

- `demo/html/material-editor/sdk-simple.html` (Line 259): HTML file that imports TypeScript file using `<script type="module" src="../../src/sdk-simple.ts"></script>`
- `demo/src/sdk-simple.ts`: Main TypeScript demo file containing MaterialEditor class and initialization logic
- `demo/tsconfig.json`: TypeScript configuration extending parent config with demo-specific settings, includes `["src/**/*"]` pattern
- `tsconfig.json` (root): Main TypeScript configuration that **excludes** demo directory: `"exclude": ["node_modules", "dist", "demo"]`
- `vite.config.ts`: Vite development server configuration with:
  - Server port: 8080 (with fallback to available ports)
  - Static file copy targets: `{ src: 'demo/**', dest: 'demo' }`
  - Opening demo page: `/demo/html/material-editor/sdk-simple.html`
  - Path alias: `'@sruim/pbr-visualizer-sdk': resolve(__dirname, 'src/index.ts')`
- `package.json` (scripts): Contains `"dev": "vite"` for development server
- `vercel.json`: Deployment configuration that copies demo files and handles rewrites

### Report (The Answers)

#### result

**问题诊断：浏览器运行时错误的原因**

根据代码分析，`demo/src/sdk-simple.ts` 在浏览器中出现运行时错误的原因主要有以下几点：

1. **TypeScript 文件类型导入问题**

   - HTML 直接使用 `<script type="module" src="../../src/sdk-simple.ts"></script>` 引入 TypeScript 文件
   - 浏览器原生不支持 `.ts` 文件执行，需要 Vite 开发服务器进行实时编译
   - 仅在 `pnpm dev`（Vite 开发模式）下工作，直接打开 HTML 文件会失败

2. **SDK 导入路径配置**

   - 文件第 1 行：`import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk'`
   - demo/tsconfig.json 第 13 行配置了路径别名：`"@sruim/pbr-visualizer-sdk": ["src/index.ts"]`
   - 此路径别名仅在 Vite 开发环境下有效，在生产构建后不适用

3. **根 tsconfig.json 排除了 demo 目录**

   - 第 35-39 行：`"exclude": ["node_modules", "dist", "demo"]`
   - 这意味着根编译器不会处理 demo 目录中的代码
   - demo/tsconfig.json 的路径别名在开发时依赖于 Vite 的处理

4. **正确的运行方式**
   ```bash
   pnpm dev
   # Vite 会在 http://localhost:8082 (或其他可用端口) 运行
   # 访问: http://localhost:8082/demo/html/material-editor/sdk-simple.html
   ```

**Demo 文件正确的位置说明**

- ✅ 当前位置是 **正确的**：`demo/src/sdk-simple.ts`
- ✅ HTML 引用路径也是 **正确的**：`../../src/sdk-simple.ts`（从 `demo/html/material-editor/` 相对路径）
- ✅ 配置文件都已到位

**为什么会出现运行时错误**

1. 如果直接在浏览器打开 `demo/html/material-editor/sdk-simple.html` 文件

   - 错误：`Failed to resolve module specifier '@sruim/pbr-visualizer-sdk'`
   - 原因：浏览器无法处理 `.ts` 文件编译和路径别名解析

2. 如果在本地文件系统中打开（file:// 协议）
   - 错误：`CORS` 或 `Module not found` 错误
   - 原因：浏览器 ES Module 不支持本地文件访问

#### conclusions

- **SDK 模块导入方式**：使用 `@sruim/pbr-visualizer-sdk` 的路径别名，通过 Vite 提供的解析能力映射到 `src/index.ts`
- **TypeScript 实时编译**：Vite 开发服务器在运行时将 `.ts` 文件编译为浏览器可执行的代码
- **Demo 目录结构**：遵循分离架构 - HTML 在 `demo/html/`，TypeScript 在 `demo/src/`，资源在 `demo/glb/` 和 `demo/hdr/`
- **Demo 配置隔离**：demo/tsconfig.json 继承根配置但添加自己的路径别名，保持项目代码和 Demo 代码的编译隔离
- **Vite 处理机制**：
  - 根 tsconfig.json 不编译 demo
  - Vite 使用 demo/tsconfig.json 编译 demo 代码
  - vite.config.ts 的路径别名确保 SDK 导入正确解析
  - viteStaticCopy 插件将 demo 目录完整复制到构建输出

#### relations

- `demo/html/material-editor/sdk-simple.html` 引用 `demo/src/sdk-simple.ts` 相对路径 `../../src/sdk-simple.ts`
- `demo/src/sdk-simple.ts` 导入 SDK 使用别名 `@sruim/pbr-visualizer-sdk`
- `vite.config.ts` 的别名定义使该导入在开发时解析到 `src/index.ts`
- `demo/tsconfig.json` 的别名定义用于 TypeScript 类型检查
- Vite 开发服务器整合这些配置实现 .ts 文件的实时编译和模块导入
- viteStaticCopy 插件在生产构建时确保 demo 文件被复制到输出目录

---

## 完整运行指南

### 开发环境（推荐方式）

```bash
# 1. 启动开发服务器
pnpm dev

# 2. 自动打开浏览器访问 demo
# http://localhost:8082/demo/html/material-editor/sdk-simple.html
```

### 生产环境（部署方式）

```bash
# 1. 构建项目
pnpm build

# 2. 预览生产构建结果
pnpm preview

# 3. 在 Vercel 上自动部署
# vercel.json 配置会处理路由重写和文件复制
```

### 工作流程说明

1. **开发时 (pnpm dev)**

   - Vite 启动 HTTP 服务器（支持跨域和 ES Module）
   - 实时编译 TypeScript 文件
   - 处理路径别名 (@sruim/pbr-visualizer-sdk → src/index.ts)
   - 浏览器通过 ES Module 加载编译后的代码

2. **生产时 (pnpm build)**
   - Rollup 将 SDK 打包到 dist/index.mjs
   - viteStaticCopy 将 demo 复制到 dist/demo
   - vercel.json 配置路由规则
   - 最终部署到 Vercel 或其他静态主机
