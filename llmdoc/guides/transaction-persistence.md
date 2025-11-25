# 事务持久化

## 概述

本指南介绍PBR Visualizer SDK的状态持久化功能，包括状态保存、恢复和历史管理。

## 1. 状态持久化

### 本地存储

```typescript
// 保存状态到本地存储
const saveState = () => {
  const state = visualizer.getCurrentState();
  localStorage.setItem('pbr-visualizer-state', JSON.stringify(state));
  console.log('状态已保存');
};

// 从本地存储恢复状态
const restoreState = async () => {
  const savedState = localStorage.getItem('pbr-visualizer-state');
  if (savedState) {
    const state = JSON.parse(savedState);
    await visualizer['applyState'](state);
    console.log('状态已恢复');
  }
};
```

### 状态快照

```typescript
// 创建状态快照
const createSnapshot = (description?: string) => {
  const state = visualizer.getCurrentState();
  return {
    id: `snapshot_${Date.now()}`,
    timestamp: Date.now(),
    description,
    state
  };
};

// 恢复快照
const restoreSnapshot = async (snapshot: any) => {
  await visualizer['applyState'](snapshot.state);
  console.log('快照已恢复:', snapshot.description);
};

// 使用示例
const snapshot = createSnapshot('用户配置');
console.log('快照:', snapshot);
await restoreSnapshot(snapshot);
```

## 2. 事务历史管理

### 基本管理

```typescript
class TransactionHistoryManager {
  constructor(private visualizer: PBRVisualizer) {}

  // 获取历史信息
  getHistory() {
    return this.visualizer['transactionHistory'].map((txn, index) => ({
      id: txn.id,
      description: txn.description,
      timestamp: txn.timestamp,
      index,
      isCurrent: index === this.visualizer['currentTransactionIndex']
    }));
  }

  // 跳转到指定事务
  async goToTransaction(index: number) {
    if (index >= 0 && index < this.visualizer['transactionHistory'].length) {
      const txn = this.visualizer['transactionHistory'][index];
      await visualizer['applyState'](txn.newState);
      visualizer['currentTransactionIndex'] = index;
    }
  }

  // 清空历史
  clearHistory() {
    this.visualizer['transactionHistory'] = [];
    this.visualizer['currentTransactionIndex'] = -1;
  }
}

// 使用示例
const historyManager = new TransactionHistoryManager(visualizer);
const history = historyManager.getHistory();
console.log('事务历史:', history);
```

### 历史优化

```typescript
// 优化历史记录
class HistoryOptimizer {
  constructor(private visualizer: PBRVisualizer, private maxHistory: number = 50) {
    this.optimize();
  }

  optimize() {
    const history = this.visualizer['transactionHistory'];
    if (history.length > this.maxHistory) {
      history.splice(0, history.length - this.maxHistory);
      this.visualizer['currentTransactionIndex'] = Math.max(0, this.visualizer['currentTransactionIndex'] - (history.length - this.maxHistory));
    }
  }
}

// 使用示例
const optimizer = new HistoryOptimizer(visualizer, 30);
```

## 3. 完整示例

### 状态管理系统

```typescript
class StatePersistenceManager {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.historyManager = new TransactionHistoryManager(visualizer);
    this.optimizer = new HistoryOptimizer(visualizer);
  }

  // 保存当前状态
  async saveState(name?: string) {
    const state = this.visualizer.getCurrentState();
    const key = `pbr-state-${name || 'default'}`;
    localStorage.setItem(key, JSON.stringify(state));
    console.log(`状态已保存: ${name || 'default'}`);
  }

  // 加载状态
  async loadState(name?: string) {
    const key = `pbr-state-${name || 'default'}`;
    const savedState = localStorage.getItem(key);
    if (savedState) {
      const state = JSON.parse(savedState);
      await this.visualizer['applyState'](state);
      console.log(`状态已加载: ${name || 'default'}`);
    }
  }

  // 获取所有保存的状态
  getSavedStates() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('pbr-state-'));
    return keys.map(key => ({
      name: key.replace('pbr-state-', ''),
      timestamp: localStorage.getItem(key)?.timestamp || Date.now()
    }));
  }

  // 清理过期状态
  cleanupOldStates(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('pbr-state-')) {
        const item = JSON.parse(localStorage.getItem(key));
        if (now - item.timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

// 使用示例
const stateManager = new StatePersistenceManager(visualizer);

// 保存状态
await stateManager.saveState('用户配置1');

// 加载状态
await stateManager.loadState('用户配置1');

// 获取所有保存的状态
const savedStates = stateManager.getSavedStates();
console.log('已保存的状态:', savedStates);
```

通过持久化功能，可以实现状态的保存、恢复和管理。