# 状态更新基础

## 基本状态管理操作

### 1. 单模型状态更新

**更新模型状态**

```typescript
// 获取可视化器实例
const visualizer = new PBRVisualizer(options);
await visualizer.initialize();

// 更新单个模型的状态
await visualizer.updateModel('model1', {
  material: {
    color: '#ff0000',      // 基础颜色
    roughness: 0.3,        // 粗糙度
    metalness: 0.8         // 金属度
  },
  transform: {
    position: new THREE.Vector3(1, 0, 0),  // 位置
    rotation: new THREE.Euler(0, Math.PI / 4, 0),  // 旋转
    scale: new THREE.Vector3(1, 1, 1)       // 缩放
  },
  visible: true           // 可见性
});
```

**更新特定属性**

```typescript
// 只更新材质颜色
await visualizer.updateModel('model1', {
  material: { color: '#00ff00' }
});

// 只更新位置
await visualizer.updateModel('model1', {
  transform: { position: new THREE.Vector3(0, 1, 0) }
});

// 只更新可见性
await visualizer.updateModel('model1', {
  visible: false
});
```

### 2. 模型可见性控制

**切换可见性**

```typescript
// 显示模型
await visualizer.updateModel('model1', {
  visible: true
});

// 隐藏模型
await visualizer.updateModel('model1', {
  visible: false
});

// 切换可见性
const toggleVisibility = async (modelId: string) => {
  const currentState = visualizer.getCurrentState();
  const currentVisibility = currentState.models[modelId]?.visible || true;

  await visualizer.updateModel(modelId, {
    visible: !currentVisibility
  });
};

// 使用示例
await toggleVisibility('model1');
```

### 3. 位置控制

**设置绝对位置**

```typescript
// 设置绝对位置
await visualizer.updateModel('model1', {
  transform: {
    position: new THREE.Vector3(1, 2, 3)
  }
});
```

**相对位置移动**

```typescript
// 相对位置移动
const moveModelRelative = async (modelId: string, delta: THREE.Vector3) => {
  const currentState = visualizer.getCurrentState();
  const currentPosition = currentState.models[modelId]?.transform?.position || new THREE.Vector3();

  const newPosition = currentPosition.clone().add(delta);

  await visualizer.updateModel(modelId, {
    transform: {
      position: newPosition
    }
  });
};

// 使用示例
await moveModelRelative('model1', new THREE.Vector3(0, 1, 0)); // 向上移动1单位
```

### 4. 安全的状态更新

**检查模型存在性**

```typescript
// 检查模型是否存在
const modelExists = visualizer['models'].has('model1');
if (modelExists) {
  await visualizer.updateModel('model1', {
    material: { color: '#ff0000' }
  });
} else {
  console.warn('模型不存在');
}
```

**安全的状态更新函数**

```typescript
// 安全的状态更新函数
const safeUpdateModel = async (modelId: string, state: Partial<ModelState>) => {
  if (!visualizer['models'].has(modelId)) {
    throw new Error(`模型 ${modelId} 不存在`);
  }

  try {
    await visualizer.updateModel(modelId, state);
    console.log(`成功更新模型 ${modelId}`);
  } catch (error) {
    console.error(`更新模型 ${modelId} 失败:`, error);
    throw error;
  }
};

// 使用示例
try {
  await safeUpdateModel('model1', { material: { color: '#ff0000' } });
} catch (error) {
  console.error('操作失败');
}
```

### 5. 事务系统集成

**自动事务创建**

每个状态更新操作都会自动创建事务：

```typescript
// 单模型更新 - 自动创建事务
await visualizer.updateModel('model1', {
  material: { color: '#ff0000' }
});

// 这个操作会被记录在事务历史中，支持撤销/重做
```

**批量事务更新**

将多个更新合并为单一事务：

```typescript
// 批量更新 - 创建单一事务
await visualizer.batchUpdate([
  { modelId: 'model1', state: { material: { color: '#ff0000' } } },
  { modelId: 'model2', state: { transform: { position: new THREE.Vector3(1, 0, 0) } } }
]);

// 所有更新会在一个事务中完成
```

**撤销和重做**

```typescript
// 撤销最近的事务
await visualizer.undo();

// 重做被撤销的事务
await visualizer.redo();

// 获取当前状态快照
const currentState = visualizer.getCurrentState();
console.log('当前状态:', currentState);
```

### 6. 完整基础示例

**包含事务功能的状态管理示例**

```typescript
// 1. 初始化
const visualizer = new PBRVisualizer(options);
await visualizer.initialize();

// 2. 设置事件监听（可选）
visualizer.on('stateChange', (event) => {
  console.log('状态变更:', event.updatedModels);
});

visualizer.on('undo', (event) => {
  console.log('撤销:', event.transaction.description);
});

// 3. 执行基本状态更新操作
try {
  // 单模型更新 - 自动创建事务
  await visualizer.updateModel('model1', {
    material: {
      color: '#ff6600',
      roughness: 0.4,
      metalness: 0.6
    },
    transform: {
      position: new THREE.Vector3(0, 1, 0)
    }
  });

  // 相对移动模型1
  await moveModelRelative('model1', new THREE.Vector3(0, 0, 1));

  // 批量更新 - 创建单一事务
  await visualizer.batchUpdate([
    { modelId: 'model2', state: { material: { color: '#00ff00' } } },
    { modelId: 'model3', state: { visible: false } }
  ]);

  // 切换模型1的可见性
  await toggleVisibility('model1');

  // 撤销最后一个批量操作
  await visualizer.undo();

  // 重做被撤销的操作
  await visualizer.redo();

  // 获取当前状态快照
  const currentState = visualizer.getCurrentState();
  console.log('当前状态快照:', currentState);

  console.log('✅ 基础状态管理完成（包含事务功能）');

} catch (error) {
  console.error('操作过程中出现错误:', error);
}

// 4. 清理
visualizer.dispose();
```

这些基础状态更新操作提供了完整的状态管理工具集，包括事务系统的全部功能。