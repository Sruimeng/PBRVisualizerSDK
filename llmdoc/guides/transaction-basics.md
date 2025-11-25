# 事务基础操作

## 概述

本指南介绍PBR Visualizer SDK事务系统的基础功能，包括撤销/重做和批量更新。

## 1. 单模型事务更新

每个模型状态更新都会自动创建一个事务：

```typescript
// 初始化
const visualizer = new PBRVisualizer(options);
await visualizer.initialize();

// 单个模型更新会自动创建事务
await visualizer.updateModel('model1', {
  material: {
    color: '#ff0000',
    roughness: 0.3
  }
});

// 这个操作会被记录在事务历史中，支持撤销/重做
```

## 2. 批量事务更新

使用批量更新可以将多个模型变更合并为单一事务：

```typescript
// 批量更新多个模型，创建单一事务
await visualizer.batchUpdate([
  {
    modelId: 'model1',
    state: {
      material: { color: '#ff0000' }
    }
  },
  {
    modelId: 'model2',
    state: {
      transform: {
        position: new THREE.Vector3(1, 0, 0)
      }
    }
  },
  {
    modelId: 'model3',
    state: {
      visible: false
    }
  }
]);

// 所有更新会在一个事务中完成
```

## 3. 撤销/重做操作

### 撤销操作

撤销最近的事务：

```typescript
// 撤销最近的事务
await visualizer.undo();

// 撤销特定次数
for (let i = 0; i < 3; i++) {
  await visualizer.undo();
}
```

### 重做操作

重做被撤销的事务：

```typescript
// 重做下一个事务
await visualizer.redo();

// 连续重做
for (let i = 0; i < 2; i++) {
  await visualizer.redo();
}
```

### 检查可用性

在执行撤销/重做前检查可用性：

```typescript
// 检查是否可以撤销
if (visualizer['currentTransactionIndex'] >= 0) {
  await visualizer.undo();
}

// 检查是否可以重做
if (visualizer['currentTransactionIndex'] < visualizer['transactionHistory'].length - 1) {
  await visualizer.redo();
}
```

## 4. 获取状态快照

获取当前的状态快照：

```typescript
// 获取完整的状态快照
const currentState = visualizer.getCurrentState();

// 状态快照可用于保存或恢复
console.log('全局状态:', currentState.global);
console.log('模型状态:', currentState.models);
```

## 5. 完整示例

```typescript
// 1. 初始化
const visualizer = new PBRVisualizer(options);
await visualizer.initialize();

// 2. 执行事务操作
try {
  // 单模型更新 - 自动创建事务
  await visualizer.updateModel('model1', {
    material: {
      color: '#ff6600',
      roughness: 0.4,
      metalness: 0.6
    }
  });

  // 批量更新 - 创建单一事务
  await visualizer.batchUpdate([
    { modelId: 'model2', state: { material: { color: '#00ff00' } } },
    { modelId: 'model3', state: { visible: false } }
  ]);

  // 撤销最后一个批量操作
  await visualizer.undo();

  // 重做被撤销的操作
  await visualizer.redo();

  // 获取当前状态快照
  const currentState = visualizer.getCurrentState();
  console.log('当前状态快照:', currentState);

  console.log('✅ 事务操作完成');

} catch (error) {
  console.error('操作过程中出现错误:', error);
}

// 3. 清理
visualizer.dispose();
```