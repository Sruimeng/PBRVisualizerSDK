# 状态管理架构

## 1. Identity

- **What it is**: 基于事务模式的分层状态管理系统，支持多模型并发更新和撤销/重做操作
- **Purpose**: 为PBR可视化提供原子性状态变更和完整的历史记录管理

## 2. 核心组件

### PBRVisualizer 主类 (`src/PBRVisualizer.ts:48-51`)

- **核心功能**: 状态管理中枢，协调全局和模型状态变更
- **关键职责**: 事务创建、历史管理、状态应用、事件分发
- **数据结构**:
  ```typescript
  private currentState!: SceneState;           // 当前完整状态
  private transactionHistory: StateTransaction[] = []; // 事务历史
  private currentTransactionIndex = -1;       // 当前事务索引
  ```

### SceneState 接口 (`src/types/core.ts:204-210`)

- **核心功能**: 场景状态的数据结构定义
- **组成**:
  ```typescript
  interface SceneState {
    global: GlobalState;          // 全局配置状态
    models: Record<string, ModelState>; // 模型状态集合
  }
  ```

### StateTransaction 接口 (`src/types/core.ts:241-253`)

- **核心功能**: 事务操作的快照数据结构
- **组成**:
  ```typescript
  interface StateTransaction {
    id: string;                    // 唯一事务ID
    timestamp: number;             // 时间戳
    previousState: SceneState;     // 变更前状态快照
    newState: SceneState;         // 变更后状态快照
    description?: string;          // 可选描述
  }
  ```

### BatchUpdate 接口 (`src/types/core.ts:255-261`)

- **核心功能**: 批量更新的数据结构，支持多模型统一事务
- **组成**:
  ```typescript
  interface BatchUpdate {
    modelId: string;               // 模型ID
    state: Partial<ModelState>;    // 要更新的部分状态
  }
  ```

### GlobalState 接口 (`src/types/core.ts:4-22`)

- **核心功能**: 全局环境、场景、相机配置
- **关键领域**: 环境贴图、场景设置、相机参数、后处理配置

### ModelState 接口 (`src/types/core.ts:181-202`)

- **核心功能**: 单个模型的完整状态定义
- **组成**: 动画、灯光、控制、材质、可见性、变换

## 3. 执行流程 (LLM Retrieval Map)

### 事务创建流程

1. **单模型更新**: `PBRVisualizer.ts:459-477` - `createTransaction()` 生成状态快照
2. **批量更新**: `PBRVisualizer.ts:483-503` - `createBatchTransaction()` 合并多个模型变更
3. **事务验证**: 检查模型存在性和状态合法性

### 状态应用流程

1. **全局状态**: `PBRVisualizer.ts:189-207` - `applyGlobalState()` 处理环境、场景、相机
2. **模型状态**: `PBRVisualizer.ts:397-429` - `applyModelUpdate()` 处理材质、变换、可见性
3. **完整状态**: `PBRVisualizer.ts:559-569` - `applyState()` 统一应用完整场景状态

### 撤销/重做流程

1. **撤销操作**: `PBRVisualizer.ts:527-538` - 恢复previousState，调整索引位置
2. **重做操作**: `PBRVisualizer.ts:543-554` - 应用newState，向前移动索引
3. **历史管理**: `PBRVisualizer.ts:509-522` - 限制历史记录数量(50个)，清理过期事务

### 事件分发流程

1. **状态变更**: `PBRVisualizer.ts:382-386` - 发送stateChange事件，包含事务ID和影响模型
2. **操作通知**: `PBRVisualizer.ts:537,553` - 发送undo/redo事件，附带事务详情
3. **错误处理**: `PBRVisualizer.ts:636-646` - 统一错误事件处理和通知机制

## 4. 设计 rationale

### 分层状态架构

- **全局状态**: 环境、场景、相机等共享配置
- **模型状态**: 每个模型的独立配置，支持并发更新
- **状态隔离**: 全局状态变更不影响模型状态，模型间状态相互独立

### 事务系统设计

- **原子性**: 每个事务包含完整的前后状态快照
- **可追溯**: 事务ID和时间戳支持精确的历史记录追踪
- **容量管理**: 限制历史记录数量，防止内存溢出

### 性能优化策略

- **深拷贝优化**: 使用对象展开运算符进行浅拷贝，结合引用共享
- **批量更新**: 支持多模型统一事务，减少历史记录碎片
- **事件节流**: 状态变更事件合并发送，避免频繁事件触发

### 状态一致性保证

- **预检查**: 事务创建前验证模型存在性和状态合法性
- **异常恢复**: 错误状态自动回滚，确保系统一致性
- **线程安全**: 所有状态变更通过主线程序列化处理

## 5. 关键特性

### 多模型并发管理

```typescript
// 支持同时管理多个独立模型
models: Record<string, ModelState> = {
  'model1': { /* 状态1 */ },
  'model2': { /* 状态2 */ },
  'model3': { /* 状态3 */ }
}
```

### 智能事务合并

```typescript
// 批量更新创建单一事务
const batchTransaction = this.createBatchTransaction([
  { modelId: 'model1', state: { material: { color: '#ff0000' } } },
  { modelId: 'model2', state: { transform: { position: new Vector3(1, 0, 0) } } }
]);
```

### 完整的历史追踪

```typescript
// 每个事务包含完整的上下文信息
{
  id: 'txn_123456789_abcdef',
  timestamp: 1634567890000,
  previousState: { /* 完整快照 */ },
  newState: { /* 完整快照 */ },
  description: '材质颜色更新'
}
```

### 状态变更事件系统

- **stateChange**: 状态变更时触发，包含事务ID和影响模型
- **undo/redo**: 撤销/重做操作时触发，附带事务详情
- **错误处理**: 统一错误事件和处理机制

### 事务持久化支持

- **历史记录**: 自动保存事务历史，支持撤销/重做
- **容量管理**: 限制历史记录数量（50个），防止内存溢出
- **状态快照**: 每个事务包含完整的前后状态快照

这个状态管理系统通过事务模式和分层架构，为PBR可视化提供了强大、可靠的状态管理能力，支持复杂的编辑操作、历史回溯和批量更新功能。
