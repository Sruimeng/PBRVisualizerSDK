# 动画状态机系统架构

## 1. Identity

- **What it is**: 完整的有限状态机(FSM)系统，用于管理3D模型的动画切换和过渡效果
- **Purpose**: 提供声明式的动画状态管理，支持淡入淡出、缩放等过渡效果

## 2. 核心组件

### AnimationStateMachine 类 (`src/core/AnimationStateMachine.ts`)

- **核心功能**: 完整的FSM实现，管理状态、转换、过渡效果
- **关键职责**:
  - 状态定义和管理
  - 状态转换条件判断
  - 过渡效果执行（淡入淡出、缩放）
  - 动画控制集成
  - 事件系统

### 类型定义 (`src/types/core.ts:441-605`)

```typescript
// 过渡效果类型
enum TransitionEffectType {
  None = 'none',
  Fade = 'fade',
  Scale = 'scale',
  FadeScale = 'fadeScale'
}

// 状态定义
interface StateMachineState {
  id: string;
  name: string;
  animationName?: string;
  animationIndex?: number;
  enterEffect?: TransitionEffectConfig;
  exitEffect?: TransitionEffectConfig;
  onEnter?: () => void;
  onExit?: () => void;
  onUpdate?: (deltaTime: number) => void;
}

// 转换定义
interface StateTransition {
  id: string;
  from: string;
  to: string;
  condition: TransitionCondition;
  effect?: TransitionEffectConfig;
  priority?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

// 转换条件
interface TransitionCondition {
  type: 'immediate' | 'animationEnd' | 'timeout' | 'custom';
  timeout?: number;
  predicate?: () => boolean;
}
```

## 3. 执行流程

### 状态机创建流程

1. **配置定义**: 定义状态列表、转换规则、默认效果
2. **实例创建**: `PBRVisualizer.createStateMachine(modelId, config)`
3. **模型绑定**: 自动绑定模型和动画
4. **启动**: `stateMachine.start()` 进入初始状态

### 状态转换流程

1. **触发转换**: `stateMachine.trigger(transitionId)` 或自动条件触发
2. **退出当前状态**: 调用 `onExit` 回调
3. **执行过渡效果**: 根据配置执行淡入淡出/缩放
4. **切换动画**: 在过渡中点切换目标动画
5. **进入新状态**: 调用 `onEnter` 回调
6. **发送事件**: 发送 `transitionEnd` 事件

### 过渡效果执行流程

1. **计算进度**: 基于时间计算过渡进度 (0-1)
2. **应用缓动**: 使用缓动函数平滑进度
3. **应用效果**:
   - 淡入淡出: 前半段淡出，后半段淡入
   - 缩放: 前半段缩小，后半段放大
4. **切换动画**: 在进度50%时切换到目标动画
5. **完成过渡**: 恢复原始材质/缩放状态

## 4. 设计 Rationale

### 声明式状态管理

- 通过配置对象定义完整的状态机行为
- 分离状态逻辑和渲染逻辑
- 便于调试和维护

### 灵活的转换条件

- **immediate**: 手动触发
- **animationEnd**: 动画播放完成后自动触发
- **timeout**: 超时后自动触发
- **custom**: 自定义条件函数

### 可组合的过渡效果

- 支持单独使用淡入淡出或缩放
- 支持组合效果 (fadeScale)
- 可配置缓动函数和时长

### 事件驱动架构

- 提供完整的事件系统
- 支持 `stateEnter`, `stateExit`, `transitionStart`, `transitionEnd`, `animationEnd` 事件
- 便于UI同步和调试

## 5. API 参考

### PBRVisualizer 状态机方法

```typescript
// 创建状态机
createStateMachine(modelId: string, config: StateMachineConfig): AnimationStateMachine | null

// 获取状态机
getStateMachine(modelId: string, stateMachineId: string): AnimationStateMachine | null

// 移除状态机
removeStateMachine(modelId: string, stateMachineId: string): boolean

// 获取模型动画列表
getModelAnimations(modelId: string): string[]

// 直接播放动画（不使用状态机）
playAnimation(modelId: string, animationName: string, options?: {...}): boolean

// 停止所有动画
stopAllAnimations(modelId: string): void
```

### AnimationStateMachine 方法

```typescript
// 绑定模型和动画
bind(model: THREE.Object3D, animations: THREE.AnimationClip[]): void

// 启动/停止状态机
start(): void
stop(): void

// 更新（在渲染循环中调用）
update(deltaTime?: number): void

// 触发转换
trigger(transitionId: string): boolean

// 直接跳转到状态
goToState(stateId: string, withEffect?: boolean): boolean

// 获取运行时状态
getState(): StateMachineRuntimeState

// 事件监听
on(event: StateMachineEvent['type'], listener: Function): void
off(event: StateMachineEvent['type'], listener: Function): void

// 销毁
dispose(): void
```

## 6. 使用示例

### 基础用法

```typescript
import { PBRVisualizer, TransitionEffectType } from '@sruim/pbr-visualizer-sdk';

// 创建状态机配置
const config = {
  id: 'animationFSM',
  initialState: 'idle',
  states: [
    {
      id: 'idle',
      name: '待机',
      animationName: 'NlaTrack',
      onEnter: () => console.log('进入待机状态')
    },
    {
      id: 'action',
      name: '动作',
      animationName: 'NlaTrack.001',
      onEnter: () => console.log('进入动作状态')
    }
  ],
  transitions: [
    {
      id: 'to_action',
      from: 'idle',
      to: 'action',
      condition: { type: 'immediate' },
      effect: {
        type: TransitionEffectType.Fade,
        duration: 500,
        easing: 'easeOutCubic',
        opacityRange: [0, 1]
      }
    },
    {
      id: 'to_idle',
      from: 'action',
      to: 'idle',
      condition: { type: 'immediate' },
      effect: {
        type: TransitionEffectType.Scale,
        duration: 500,
        easing: 'easeOutCubic',
        scaleRange: [0.8, 1]
      }
    }
  ],
  debug: true
};

// 创建并启动状态机
const stateMachine = visualizer.createStateMachine('myModel', config);
stateMachine.start();

// 触发状态转换
stateMachine.trigger('to_action');

// 监听事件
stateMachine.on('transitionEnd', (event) => {
  console.log(`过渡完成: ${event.currentState}`);
});
```

### 自动转换示例

```typescript
// 动画播放完成后自动切换
{
  id: 'auto_return',
  from: 'action',
  to: 'idle',
  condition: { type: 'animationEnd' }
}

// 超时后自动切换
{
  id: 'timeout_switch',
  from: 'idle',
  to: 'action',
  condition: { type: 'timeout', timeout: 3000 }
}

// 自定义条件
{
  id: 'custom_switch',
  from: 'idle',
  to: 'action',
  condition: {
    type: 'custom',
    predicate: () => someExternalCondition
  }
}
```

## 7. 内置缓动函数

系统内置以下缓动函数：

- `linear`: 线性
- `easeInQuad`: 二次方缓入
- `easeOutQuad`: 二次方缓出
- `easeInOutQuad`: 二次方缓入缓出
- `easeInCubic`: 三次方缓入
- `easeOutCubic`: 三次方缓出（默认）
- `easeInOutCubic`: 三次方缓入缓出
- `easeInElastic`: 弹性缓入
- `easeOutElastic`: 弹性缓出
- `easeInOutElastic`: 弹性缓入缓出

## 8. 预设过渡效果配置

系统提供5种预设的过渡效果配置 (`FADE_PRESETS`)：

### 强化效果预设

- **`strong`**: 透明度范围 [0.2, 1]，600ms持续时间，适合明显但不突兀的切换
- **`dramatic`**: 透明度范围 [0.1, 1]，800ms弹性缓动，戏剧化视觉效果
- **`natural`**: 透明度范围 [0.5, 1]，500ms，自然柔和的过渡
- **`quick`**: 透明度范围 [0.4, 1]，300ms，快速切换适合快节奏动画
- **`character`**: 透明度范围 [0.25, 1]，600ms轻微缩放，专为角色动画优化

```typescript
// 使用预设
import { FADE_PRESETS } from '@sruim/pbr-visualizer-sdk';

{
  id: 'transition',
  from: 'idle',
  to: 'action',
  condition: { type: 'immediate' },
  effect: FADE_PRESETS.character // 直接使用预设
}
```

## 9. 性能考虑

- 状态机更新在渲染循环中执行，需注意性能影响
- 过渡效果会修改材质属性，完成后会恢复原始状态
- 多个状态机可以并行运行，各自独立管理
- 增强的透明度对比度（默认[0.3, 1]）在提供明显效果的同时保持性能
- 预设配置已优化平衡视觉效果和性能开销

## 10. 调试支持

- 设置 `debug: true` 启用详细日志
- 通过事件系统监听状态变化
- `getState()` 方法提供实时状态信息
