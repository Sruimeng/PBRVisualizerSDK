# 状态管理架构

本文档描述PBR Visualizer SDK的分层状态管理系统,包括全局状态、模型状态、事务操作和撤销/重做机制。

## 概述

PBR Visualizer采用**分层状态管理**架构,将场景状态分为两个层级:

1. **全局状态** (Global State): 影响整个场景的属性(环境、相机、后处理)
2. **模型状态** (Model State): 每个3D模型独立的属性(材质、变换、可见性)

这种设计支持复杂的产品配置器场景,例如汽车配置器可以独立调整车身颜色和轮毂材质,同时保持统一的环境和相机。

## 状态数据结构

### 场景状态(SceneState)

完整的场景状态结构:

```typescript
interface SceneState {
  // 全局共享状态
  global: GlobalState;

  // 模型局部状态 (key为modelId)
  models: Record<string, ModelState>;
}
```

### 全局状态(GlobalState)

```typescript
interface GlobalState {
  // 环境配置
  environment: EnvironmentConfig;

  // 相机状态
  camera: CameraState;

  // 后处理配置
  postProcessing: PostProcessState;

  // 场景设置
  sceneSettings: {
    exposure: number;          // 曝光值
    backgroundColor?: string;  // 背景颜色
  };
}
```

#### 环境配置

```typescript
interface EnvironmentConfig {
  type: 'hdr' | 'noise-sphere' | 'procedural-sky';

  // HDR环境
  hdr?: {
    url: string;
    intensity: number;
  };

  // 噪波球体
  sphere?: {
    radius: number;        // 0-1
    pulse: boolean;
    color1?: string;
    color2?: string;
    speed?: number;
  };

  // 程序化天空
  sky?: {
    topColor: string;
    bottomColor: string;
  };
}
```

#### 相机状态

```typescript
interface CameraState {
  position: [number, number, number];  // [x, y, z]
  target: [number, number, number];    // 朝向目标
  fov: number;                         // 视场角 (度)
  near?: number;                       // 近裁剪面
  far?: number;                        // 远裁剪面
}
```

#### 后处理状态

```typescript
interface PostProcessState {
  enabled: boolean;
  aces?: boolean;                    // ACES色调映射
  exposure?: number;                 // 曝光调整

  bloom?: {
    enabled: boolean;
    intensity: number;
    threshold: number;
    smoothWidth?: number;
  };

  ssao?: {
    enabled: boolean;
    radius: number;
    intensity: number;
    bias?: number;
  };
}
```

### 模型状态(ModelState)

每个模型的独立状态:

```typescript
interface ModelState {
  // 可见性
  visible: boolean;

  // 变换
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];  // Euler角 (弧度)
    scale: [number, number, number];
  };

  // 材质 (key为材质名称)
  materials: Record<string, MaterialState>;

  // 动画
  animations?: AnimationState;
}
```

#### 材质状态

```typescript
interface MaterialState {
  // PBR参数
  color?: string;              // 十六进制颜色
  roughness?: number;          // 0-1
  metalness?: number;          // 0-1
  envMapIntensity?: number;    // 环境反射强度

  // 透明度
  transparent?: boolean;
  opacity?: number;            // 0-1

  // 纹理
  map?: string;                // 基础颜色贴图URL
  normalMap?: string;          // 法线贴图URL
  roughnessMap?: string;       // 粗糙度贴图URL
  metalnessMap?: string;       // 金属度贴图URL
}
```

## StateMachine类

状态机负责管理状态转换和历史记录。

### 类结构

```typescript
class StateMachine {
  private states: Map<string, SceneState>;
  private history: StateTransaction[];
  private currentIndex: number;

  // 注册状态
  registerState(id: string, state: SceneState): void;

  // 应用状态
  applyState(id: string, options?: TransitionOptions): Promise<void>;

  // 更新模型状态
  updateModelState(modelId: string, state: Partial<ModelState>): void;

  // 批量更新
  batchUpdate(updates: BatchUpdate[], options?: BatchOptions): Promise<void>;

  // 撤销/重做
  undo(): void;
  redo(): void;

  // 序列化
  serialize(): string;
  deserialize(data: string): void;
}
```

### 核心方法

#### registerState

注册命名状态,用于预设配置:

```typescript
// 注册"金色"配置
stateMachine.registerState('golden', {
  global: { environment: { type: 'hdr', hdr: { url: '/studio.hdr' } } },
  models: {
    'body': {
      materials: {
        'paint': { color: '#ffd700', roughness: 0.2, metalness: 0.9 }
      }
    }
  }
});

// 应用配置
await stateMachine.applyState('golden', { duration: 800 });
```

#### updateModelState

更新单个模型的状态:

```typescript
// 更新材质
stateMachine.updateModelState('car_body', {
  materials: {
    'paint': { color: '#ff0000', roughness: 0.3 }
  }
});

// 更新变换
stateMachine.updateModelState('wheel', {
  transform: {
    rotation: [0, Math.PI/4, 0]
  }
});
```

#### batchUpdate

原子性批量更新多个模型:

```typescript
await stateMachine.batchUpdate([
  {
    modelId: 'body',
    state: { materials: { 'paint': { color: '#0000ff' } } }
  },
  {
    modelId: 'wheels',
    state: { materials: { 'rim': { roughness: 0.1 } } }
  }
], {
  duration: 500,
  description: 'color_scheme_change'
});
```

**原子性保证**: 批量更新要么全部成功,要么全部回滚。

## 事务操作

### 事务结构

```typescript
interface StateTransaction {
  id: string;                          // 唯一标识
  timestamp: number;                   // 时间戳
  description?: string;                // 描述
  prevState: Partial<SceneState>;      // 变更前状态
  nextState: Partial<SceneState>;      // 变更后状态
}
```

### 事务历史

状态机维护操作历史栈:

```
[初始状态] → [事务1] → [事务2] → [当前状态]
                         ↑
                    currentIndex
```

### 撤销/重做

```typescript
// 撤销最后一次操作
stateMachine.undo();

// 重做
stateMachine.redo();

// 检查是否可以撤销/重做
const canUndo = stateMachine.canUndo();
const canRedo = stateMachine.canRedo();
```

**实现原理**:
1. 每次状态更新创建事务记录
2. 保存变更前后的状态快照
3. 撤销时应用`prevState`,重做时应用`nextState`
4. 历史栈限制大小,避免内存溢出

### 历史限制

```typescript
class StateMachine {
  private maxHistorySize = 50;  // 最多保留50条历史

  private addTransaction(transaction: StateTransaction) {
    // 截断重做历史
    this.history = this.history.slice(0, this.currentIndex + 1);

    // 添加新事务
    this.history.push(transaction);

    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    this.currentIndex = this.history.length - 1;
  }
}
```

## 状态转换

### 过渡选项

```typescript
interface TransitionOptions {
  duration?: number;        // 过渡时长 (ms)
  easing?: EasingFunction;  // 缓动函数
  onProgress?: (progress: number) => void;  // 进度回调
}

// 使用示例
await visualizer.updateModel('body', {
  materials: { paint: { color: '#ff0000' } }
}, {
  duration: 800,
  easing: 'easeInOutQuad',
  onProgress: (p) => console.log(`进度: ${p * 100}%`)
});
```

### 缓动函数

支持的缓动类型:
- `linear`: 线性
- `easeInQuad`: 二次缓入
- `easeOutQuad`: 二次缓出
- `easeInOutQuad`: 二次缓入缓出
- `easeInCubic`: 三次缓入
- `easeOutCubic`: 三次缓出

### 插值实现

颜色插值:

```typescript
function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return rgbToHex(r, g, b);
}
```

数值插值:

```typescript
function interpolateNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

## 状态序列化

### 生成分享URL

```typescript
// 序列化当前状态
const stateString = stateMachine.serialize();

// 生成短链接
const shareUrl = await visualizer.shareState();
// 返回: https://example.com/view?s=abc123

// 用户访问链接后恢复状态
visualizer.applyRawState(deserializedState);
```

### 序列化格式

使用JSON压缩:

```typescript
interface SerializedState {
  version: string;              // 状态格式版本
  timestamp: number;            // 序列化时间
  state: SceneState;            // 完整状态
  metadata?: {                  // 可选元数据
    author?: string;
    description?: string;
  };
}
```

### 压缩策略

1. JSON字符串化
2. 移除空白字符
3. Base64编码
4. (可选) LZ压缩

```typescript
function serialize(state: SceneState): string {
  const data: SerializedState = {
    version: '1.0',
    timestamp: Date.now(),
    state
  };

  const json = JSON.stringify(data);
  const compressed = LZString.compressToBase64(json);
  return compressed;
}
```

## 事件系统

### 状态变更事件

```typescript
visualizer.on('stateChange', (event: StateChangeEvent) => {
  console.log('状态ID:', event.stateId);
  console.log('变更的模型:', event.updatedModels);
  console.log('变更类型:', event.type);  // 'update' | 'batch' | 'undo' | 'redo'
});
```

### 事务事件

```typescript
visualizer.on('transactionComplete', (transaction: StateTransaction) => {
  console.log('事务描述:', transaction.description);
  console.log('可撤销:', visualizer.canUndo());
});
```

## 使用模式

### 模式1: 产品配置器

```typescript
class ProductConfigurator {
  constructor(visualizer: PBRVisualizer) {
    this.visualizer = visualizer;
  }

  // 切换颜色
  async selectColor(color: string) {
    await this.visualizer.updateModel('body', {
      materials: { 'paint': { color } }
    }, { duration: 300 });
  }

  // 切换材质
  async selectFinish(finish: 'glossy' | 'matte') {
    const roughness = finish === 'matte' ? 0.8 : 0.2;
    await this.visualizer.updateModel('body', {
      materials: { 'paint': { roughness } }
    }, { duration: 300 });
  }

  // 撤销
  undo() {
    this.visualizer.undo();
  }

  // 重做
  redo() {
    this.visualizer.redo();
  }

  // 分享配置
  async share() {
    const url = await this.visualizer.shareState();
    navigator.clipboard.writeText(url);
  }
}
```

### 模式2: 场景预设

```typescript
// 定义预设
const presets = {
  'studio': {
    global: {
      environment: { type: 'hdr', hdr: { url: '/studio.hdr', intensity: 1.0 } },
      camera: { position: [3, 2, 5], target: [0, 0.5, 0], fov: 45 }
    }
  },
  'outdoor': {
    global: {
      environment: { type: 'hdr', hdr: { url: '/outdoor.hdr', intensity: 1.2 } },
      camera: { position: [5, 3, 7], target: [0, 0, 0], fov: 50 }
    }
  }
};

// 注册预设
Object.entries(presets).forEach(([id, state]) => {
  visualizer.stateMachine.registerState(id, state);
});

// 切换预设
async function selectPreset(presetId: string) {
  await visualizer.stateMachine.applyState(presetId, { duration: 1000 });
}
```

### 模式3: A/B对比

```typescript
// 保存配置A
const configA = visualizer.stateMachine.serialize();

// 修改为配置B
await visualizer.updateModel('body', {
  materials: { 'paint': { color: '#0000ff' } }
});
const configB = visualizer.stateMachine.serialize();

// 对比
function toggleConfig() {
  const current = this.isConfigA ? configB : configA;
  visualizer.applyRawState(JSON.parse(LZString.decompressFromBase64(current)));
  this.isConfigA = !this.isConfigA;
}
```

## 性能优化

### 1. 增量更新

仅更新变更的属性:

```typescript
// ✅ 推荐: 仅更新颜色
visualizer.updateModel('body', {
  materials: { 'paint': { color: '#ff0000' } }
});

// ❌ 避免: 提供完整状态
visualizer.updateModel('body', {
  visible: true,
  transform: { ... },
  materials: { ... }  // 即使未变更也提供
});
```

### 2. 批量更新

使用`batchUpdate`减少渲染次数:

```typescript
// ❌ 避免: 多次单独更新
await visualizer.updateModel('body', { ... });
await visualizer.updateModel('wheel1', { ... });
await visualizer.updateModel('wheel2', { ... });

// ✅ 推荐: 批量更新
await visualizer.batchUpdate([
  { modelId: 'body', state: { ... } },
  { modelId: 'wheel1', state: { ... } },
  { modelId: 'wheel2', state: { ... } }
]);
```

### 3. 防抖动

频繁的用户输入需要防抖:

```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((color) => {
  visualizer.updateModel('body', {
    materials: { 'paint': { color } }
  });
}, 300);

// 滑块onChange
colorPicker.onChange(debouncedUpdate);
```

## 相关文档

- **架构设计**: `docs/架构.md` 第2.2节 - 状态管理架构
- **API参考**: `reference/api.md` - StateMachine类完整API (待创建)
- **React集成**: `guides/react-integration.md` - React hooks使用 (待创建)
