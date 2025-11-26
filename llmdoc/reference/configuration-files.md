# 配置文件参考

## 1. 核心摘要

本文档提供了PBR Visualizer SDK所有配置文件的详细说明和配置选项。这些配置文件定义了项目的构建、开发、部署等各个环节的行为和规则。

## 2. TypeScript配置

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/core/*": ["src/core/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "tests/**/*.ts",
    "tests/**/*.tsx"
  ],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**关键配置说明：**

- `strict`: 启用所有严格类型检查
- `noUncheckedIndexedAccess`: 安全的索引访问
- `paths`: 配置路径别名，便于导入
- `isolatedModules`: 确保每个文件都是独立的模块

## 3. 构建配置

### Vite配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  // 基础配置
  base: '/',
  root: '.',
  publicDir: 'public',

  // 插件配置
  plugins: [
    // Vue支持（如果需要）
    vue(),

    // 生成TypeScript声明文件
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
      copyDtsFiles: true,
    })
  ],

  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/utils': resolve(__dirname, 'src/utils')
    }
  },

  // 构建配置
  build: {
    // 库模式构建
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PBRVisualizer',
      fileName: (format) => `pbr-visualizer.${format}.js`,
      formats: ['es', 'umd']
    },

    // 构建选项
    rollupOptions: {
      // 外部依赖
      external: ['three', 'postprocessing'],
      output: {
        globals: {
          'three': 'THREE',
          'postprocessing': 'postprocessing'
        }
      }
    },

    // 代码优化
    minify: 'terser',
    sourcemap: true,
    // 分块策略
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three'],
          postprocessing: ['postprocessing']
        }
      }
    }
  },

  // 开发服务器
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },

  // 优化配置
  optimizeDeps: {
    include: ['three', 'postprocessing']
  }
});
```

### Rollup配置 (rollup.config.js)

```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';

const packageJson = require('./package.json');

export default [
  // ES模块版本
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      terser(),
    ],
  },

  // 声明文件版本
  {
    input: 'dist/esm/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
```

**构建配置要点：**

- 支持库模式构建，发布为NPM包
- 生成完整的TypeScript声明文件
- 配置了代码分割和优化策略
- 支持开发和生产环境的不同配置

## 4. 代码质量配置

### ESLint配置 (.eslintrc.js)

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    // TypeScript规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/require-default-prop': 'warn',
    'vue/require-explicit-emits': 'warn',

    // 通用规则
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Prettier配置 (.prettierrc)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false,
  "htmlWhitespaceSensitivity": "ignore"
}
```

### 编辑器配置 (.editorconfig)

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.{md,yml,yaml}]
indent_size = 2

[*.json]
indent_size = 2

[{package.json,package-lock.json,*.json5}]
indent_style = space
indent_size = 2

[*.{md,markdown}]
trim_trailing_whitespace = false
```

**代码质量配置要点：**

- 严格的TypeScript类型检查
- Vue 3最佳实践规则
- 统一的代码格式化
- 编辑器配置一致性

## 5. Git配置

### .gitignore

```gitignore
# 依赖
node_modules/
.yarn/
.pnp.*

# 构建输出
dist/
build/
coverage/

# 环境文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# 系统文件
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE配置
.vscode/
.idea/
*.swp
*.swo
*~

# 测试覆盖率
coverage/
.nyc_output/

# 缓存
.cache/
.temp/
*.tmp

# 可选的npm缓存目录
.npm

# 可选的yarn缓存目录
.yarn/cache

# 可选的eslint缓存
.eslintcache

# 微型静态服务器缓存
.cache/

# 可选的REPL历史
.node_repl_history

# 错误日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# electron-build
dist-electron/
```

### 提交规范 (commitlint.config.js)

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式修改
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建工具或依赖管理
        'ci',       // CI配置
        'build',    // 构建相关
        'revert',   // 回滚
        'wip',      // 进行中的工作
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};
```

**Git配置要点：**

- 全面的文件忽略规则
- 基于约定的提交信息规范
- 支持Conventional Commits标准

## 6. 开发工具配置

### Husky配置 (package.json)

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### 开发环境配置 (.env.development)

```env
VITE_APP_TITLE=PBR Visualizer Dev
VITE_APP_ENV=development
VITE_APP_BASE_API=/api
VITE_APP_PUBLIC_PATH=/

# 开发服务器配置
VITE_DEV_SERVER_PORT=3000
VITE_DEV_SERVER_HOST=localhost
VITE_DEV_SERVER_HTTPS=false

# 开发环境开关
VITE_APP_MOCK=false
VITE_APP_MOCK_DELAY=200
```

### 生产环境配置 (.env.production)

```env
VITE_APP_TITLE=PBR Visualizer
VITE_APP_ENV=production
VITE_APP_BASE_API=/api
VITE_APP_PUBLIC_PATH=/

# 生产环境配置
VITE_APP_MOCK=false
VITE_APP_COMPRESS=true
VITE_APP_GZIP=true
VITE_APP_PWA=true
```

**开发工具配置要点：**

- Git Hooks自动化检查
- 不同环境的配置隔离
- 开发和生产环境差异化配置

## 7. NPM配置

### package.json

```json
{
  "name": "pbr-visualizer-sdk",
  "version": "1.0.0",
  "description": "Professional PBR visualization SDK based on Three.js",
  "type": "module",
  "main": "./dist/pbr-visualizer.umd.js",
  "module": "./dist/pbr-visualizer.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/pbr-visualizer.es.js",
      "require": "./dist/pbr-visualizer.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "vite",
    "build": "run-p type-check build-only",
    "build-only": "vite build",
    "type-check": "vue-tsc --noEmit",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
    "format": "prettier --write src/",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run",
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:serve": "vitepress serve docs"
  },
  "keywords": [
    "three.js",
    "pbr",
    "visualization",
    "3d",
    "webgl",
    "rendering",
    "typescript",
    "sdk"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/pbr-visualizer-sdk.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/pbr-visualizer-sdk/issues"
  },
  "homepage": "https://github.com/yourusername/pbr-visualizer-sdk#readme",
  "dependencies": {
    "three": "^0.181.2",
    "postprocessing": "^6.33.4"
  },
  "devDependencies": {
    "@types/three": "^0.161.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-vue": "^4.2.3",
    "eslint": "^8.45.0",
    "eslint-plugin-vue": "^9.15.1",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3",
    "prettier": "^3.0.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "vue-tsc": "^1.8.5"
  }
}
```

**NPM配置要点：**

- 完整的包信息配置
- 多格式模块导出
- 开发和生产脚本分离
- 依赖和开发依赖明确分类

## 8. CI/CD配置

### GitHub Actions (.github/workflows/ci.yml)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run type check
      run: npm run type-check

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm run test:run

    - name: Build
      run: npm run build

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
        registry-url: 'https://registry.npmjs.org'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Publish to NPM
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 部署配置 (vercel.json)

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**CI/CD配置要点：**

- 多版本Node.js测试
- 自动化构建和发布
- 安全的密钥管理
- 静态资源部署优化

这些配置文件为PBR Visualizer SDK提供了完整的工程化基础设施，支持高质量的开发、构建和部署流程。
