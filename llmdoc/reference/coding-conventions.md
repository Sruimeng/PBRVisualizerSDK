# 代码规范

本文档描述PBR Visualizer SDK项目的编码规范和最佳实践。

## TypeScript配置

### 编译器选项

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "node",
  "lib": ["ES2020", "DOM", "DOM.Iterable"],
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### 关键规则

- **严格模式**: 启用所有严格类型检查选项
- **无未使用变量**: 禁止未使用的局部变量和参数
- **显式返回**: 所有代码路径必须返回值
- **路径别名**:
  - `@/*`: 映射到 `src/*`
  - `@sruim/pbr-visualizer-sdk`: 映射到 `src/index.ts`

## ESLint配置

### 继承规则集

- `@eslint/js` 推荐配置
- `typescript-eslint` 推荐配置
- `eslint-plugin-react` 推荐配置(React部分)
- `eslint-plugin-jsx-a11y` 推荐配置(可访问性)
- `@react-three/eslint-plugin` 推荐配置(Three.js最佳实践)
- `eslint-plugin-prettier` 推荐配置

### 文件范围

- 检查目标: `**/*.{ts,tsx}` 文件
- 忽略目录: `**/*/.react-router`, `**/*/public`, `node_modules`, `dist`

## Prettier配置

### 格式化规则

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### 关键设置

- **单引号**: 使用单引号而非双引号
- **分号**: 语句结尾需要分号
- **尾随逗号**: 多行结构末尾添加逗号
- **行宽限制**: 100字符
- **导入排序**: 使用 `prettier-plugin-organize-imports` 自动组织导入

### 特殊文件处理

- **Markdown文件**: 禁用嵌入式语言格式化,保持代码块原样
- **.prettierrc**: 使用JSON解析器

## 代码风格最佳实践

### 命名约定

- **文件名**:
  - 组件使用PascalCase: `PBRVisualizer.tsx`
  - 工具函数使用camelCase: `createLights.ts`
  - 类型定义使用PascalCase: `core.ts`

- **变量和函数**: camelCase
  ```typescript
  const environmentSystem = new EnvironmentSystem();
  function createLights(config) { }
  ```

- **类和接口**: PascalCase
  ```typescript
  class PBRVisualizer { }
  interface EnvironmentConfig { }
  ```

- **常量**: UPPER_SNAKE_CASE
  ```typescript
  const MAX_PMREM_SAMPLES = 20;
  ```

### 类型使用

- 优先使用接口定义对象类型
- 避免使用 `any`,使用 `unknown` 或泛型
- 导出的API必须有完整类型定义
- 使用类型推断,避免冗余类型标注

```typescript
// ✅ 推荐
interface MaterialState {
  color: string;
  roughness: number;
  metalness: number;
}

// ❌ 避免
let material: any;
```

### 导入顺序

由 `prettier-plugin-organize-imports` 自动管理:

1. 外部依赖 (three, postprocessing, react)
2. 内部别名导入 (@/...)
3. 相对导入

### 注释规范

- 使用TSDoc规范为公共API添加文档注释
- 复杂逻辑添加行内注释说明意图
- 避免无意义的注释(代码自解释)

```typescript
/**
 * 更新模型的材质状态
 * @param modelId - 模型唯一标识符
 * @param state - 要更新的材质属性
 * @returns Promise,在状态应用完成后resolve
 */
async function updateModel(modelId: string, state: Partial<MaterialState>): Promise<void> {
  // 验证模型是否存在
  if (!models.has(modelId)) {
    throw new Error(`Model ${modelId} not found`);
  }

  // 应用材质更新
  await applyMaterialState(state);
}
```

## 提交前检查

### lint-staged配置

Git提交前自动运行:

```json
{
  "src/**/*.ts": [
    "eslint --cache --fix",
    "sh -c 'tsc -b tsconfig.check.json'"
  ]
}
```

### 检查流程

1. **ESLint**: 自动修复可修复的问题
2. **TypeScript**: 类型检查,确保无类型错误
3. 仅检查暂存区文件,提升效率

## 构建规范

### 输出格式

- **主导出**: ESM格式 (`dist/index.mjs`)
- **类型定义**: 自动生成 (`dist/types/index.d.ts`)
- **Source Map**: 生产构建启用

### 外部依赖

以下依赖标记为external,不打包:
- `three`
- `postprocessing`
- `react` (React组件部分)
- `react-dom` (React组件部分)
- `react/jsx-runtime`

### 代码分割

- 核心API: `dist/index.mjs`
- React集成: `dist/react/index.mjs`

## 性能优化规范

### Three.js使用

- 及时dispose不再使用的几何体和材质
- 避免在每帧创建新对象
- 使用对象池管理频繁创建销毁的对象
- 合理使用 `needsUpdate` 标志

```typescript
// ✅ 推荐
material.color.set(newColor);
material.needsUpdate = true;

// ❌ 避免(每帧创建新材质)
function render() {
  object.material = new THREE.MeshStandardMaterial({ color: newColor });
}
```

### 内存管理

- WebGL资源使用后必须调用 `dispose()`
- 纹理、几何体、材质都需要显式清理
- 使用WeakMap存储临时关联数据

## React集成规范

### Hooks使用

- 遵循React Hooks规则
- 使用 `eslint-plugin-react-hooks` 检查

### Three.js对象管理

- 使用 `@react-three/eslint-plugin` 检查常见错误
- 在useEffect清理函数中dispose资源

```typescript
useEffect(() => {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial();

  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);
```

## 开发建议

- 运行 `pnpm dev` 启动开发服务器,实时查看效果
- 使用 `pnpm lint:fix` 自动修复代码风格问题
- 提交前确保 `pnpm check:ts` 通过
- 参考 `demo/` 目录中的示例代码学习最佳实践
