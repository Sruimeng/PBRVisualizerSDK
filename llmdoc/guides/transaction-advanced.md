# 高级事务功能

## 概述

本指南介绍PBR Visualizer SDK的高级事务功能，包括事务管理工具和性能优化。

## 1. 事务管理工具

### 带描述的事务操作

```typescript
class EnhancedTransactionManager {
  constructor(private visualizer: PBRVisualizer) {}

  // 带描述的单模型更新
  async updateWithDescription(modelId: string, state: Partial<ModelState>, description?: string) {
    await visualizer.updateModel(modelId, state);
    console.log(`更新完成: ${description || modelId}`);
  }

  // 带描述的批量更新
  async batchUpdateWithDescription(updates: BatchUpdate[], description?: string) {
    await visualizer.batchUpdate(updates);
    console.log(`批量更新完成: ${description || '无描述'}`);
  }
}

// 使用示例
const enhancedManager = new EnhancedTransactionManager(visualizer);
await enhancedManager.updateWithDescription('model1', { material: { color: '#ff0000' } }, '更改颜色');
```

### 智能事务合并

```typescript
class SmartTransactionMerger {
  constructor(private visualizer: PBRVisualizer) {
    this.pendingUpdates = [];
    this.mergeTimeout = null;
  }

  private pendingUpdates: BatchUpdate[];
  private mergeTimeout: any;

  // 添加待合并的更新
  addUpdate(modelId: string, state: Partial<ModelState>) {
    this.pendingUpdates.push({ modelId, state });

    if (this.mergeTimeout) {
      clearTimeout(this.mergeTimeout);
    }

    // 500ms后执行合并
    this.mergeTimeout = setTimeout(() => {
      this.flushPendingUpdates();
    }, 500);
  }

  // 立即刷新
  flushPendingUpdates() {
    if (this.pendingUpdates.length > 0) {
      visualizer.batchUpdate(this.pendingUpdates);
      this.pendingUpdates = [];
    }
  }
}

// 使用示例
const merger = new SmartTransactionMerger(visualizer);
merger.addUpdate('model1', { material: { color: '#ff0000' } });
merger.addUpdate('model1', { material: { roughness: 0.5 } });
```

## 2. 完整示例

### 高级事务管理系统

```typescript
class AdvancedTransactionSystem {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.transactionManager = new EnhancedTransactionManager(visualizer);
    this.merger = new SmartTransactionMerger(visualizer);
  }

  async executeScenario() {
    // 使用智能合并
    this.merger.addUpdate('model1', { material: { color: '#ff0000' } });
    this.merger.addUpdate('model1', { material: { roughness: 0.5 } });

    // 使用带描述的批量更新
    await this.transactionManager.batchUpdateWithDescription([
      { modelId: 'model2', state: { transform: { position: new THREE.Vector3(1, 0, 0) } } },
      { modelId: 'model3', state: { visible: false } }
    ], '批量更新模型');

    // 撤销和重做
    await this.visualizer.undo();
    await this.visualizer.redo();
  }
}

// 使用示例
const visualizer = new PBRVisualizer(options);
await visualizer.initialize();

const advancedSystem = new AdvancedTransactionSystem(visualizer);
await advancedSystem.executeScenario();

visualizer.dispose();
```

通过高级事务功能，可以实现复杂的事务管理和性能优化。
