# 事务事件系统

## 概述

本指南介绍PBR Visualizer SDK的事件系统，包括状态变更事件、撤销/重做事件的监听和处理。

## 1. 事件类型

### 状态变更事件

```typescript
visualizer.on('stateChange', (event) => {
  console.log('状态变更:', event);
  console.log('影响模型:', event.updatedModels);
});
```

### 撤销/重做事件

```typescript
visualizer.on('undo', (event) => {
  console.log('撤销事务:', event.transaction);
});

visualizer.on('redo', (event) => {
  console.log('重做事务:', event.transaction);
});
```

## 2. 事件监听管理

### 基本监听

```typescript
// 添加监听器
const listener = (event) => {
  console.log('状态变更:', event);
};

visualizer.on('stateChange', listener);

// 移除监听器
visualizer.off('stateChange', listener);

// 一次性监听
visualizer.once('stateChange', (event) => {
  console.log('首次状态变更:', event);
});
```

### 错误处理

```typescript
// 监听错误事件
visualizer.on('error', (event) => {
  console.error('系统错误:', event);

  if (event.recoverable) {
    console.log('尝试自动恢复...');
  } else {
    alert('严重错误，请刷新页面');
  }
});
```

## 3. 完整示例

### 事件驱动的状态管理

```typescript
class StateEventManager {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.operationHistory = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.visualizer.on('stateChange', (event) => {
      this.handleStateChange(event);
    });

    this.visualizer.on('undo', (event) => {
      this.handleUndo(event);
    });

    this.visualizer.on('redo', (event) => {
      this.handleRedo(event);
    });
  }

  handleStateChange(event) {
    const record = {
      type: 'stateChange',
      timestamp: new Date(),
      models: event.updatedModels
    };

    this.operationHistory.push(record);
    console.log('操作记录:', record);
  }

  handleUndo(event) {
    const record = {
      type: 'undo',
      timestamp: new Date(),
      description: event.transaction.description
    };

    this.operationHistory.push(record);
    console.log('撤销记录:', record);
  }

  getHistory() {
    return this.operationHistory;
  }
}

// 使用示例
const visualizer = new PBRVisualizer(options);
await visualizer.initialize();

const eventManager = new StateEventManager(visualizer);

// 执行操作
await visualizer.updateModel('model1', { material: { color: '#ff0000' } });
await visualizer.batchUpdate([
  { modelId: 'model2', state: { transform: { position: new THREE.Vector3(1, 0, 0) } } }
]);

// 查看操作历史
console.log('操作历史:', eventManager.getHistory());

visualizer.dispose();
```

通过事件系统，可以实现响应式的状态管理和用户界面更新。