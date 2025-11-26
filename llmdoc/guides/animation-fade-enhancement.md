# 状态机淡入淡出效果增强指南

## 概述

本指南展示如何使用PBR Visualizer SDK中增强的状态机淡入淡出效果。通过调整透明度对比度和使用预设配置，您可以获得更明显的视觉过渡效果。

## 快速开始

### 1. 使用预设配置

SDK提供了5种预设的过渡效果配置：

```typescript
import { PBRVisualizer, FADE_PRESETS, TransitionEffectType } from '@sruim/pbr-visualizer-sdk';

const visualizer = new PBRVisualizer({ /* ... */ });

// 创建状态机配置
const config = {
  id: 'characterFSM',
  initialState: 'idle',
  states: [
    {
      id: 'idle',
      name: '待机',
      animationName: 'idle_animation'
    },
    {
      id: 'walk',
      name: '行走',
      animationName: 'walk_animation'
    },
    {
      id: 'run',
      name: '奔跑',
      animationName: 'run_animation'
    }
  ],
  transitions: [
    {
      id: 'idle_to_walk',
      from: 'idle',
      to: 'walk',
      condition: { type: 'immediate' },
      effect: FADE_PRESETS.character // 使用角色动画专用预设
    },
    {
      id: 'walk_to_run',
      from: 'walk',
      to: 'run',
      condition: { type: 'immediate' },
      effect: FADE_PRESETS.strong // 使用强化预设
    }
  ]
};

const stateMachine = visualizer.createStateMachine('characterModel', config);
stateMachine.start();
```

### 2. 自定义透明度范围

```typescript
// 自定义更强的透明度对比度
const customEffect = {
  type: TransitionEffectType.FadeScale,
  duration: 700,
  easing: 'easeOutCubic',
  opacityRange: [0.15, 1], // 从15%可见到完全不透明
  scaleRange: [0.88, 1.08] // 配合轻微缩放
};

const config = {
  // ... 其他配置
  transitions: [
    {
      id: 'special_transition',
      from: 'state1',
      to: 'state2',
      condition: { type: 'immediate' },
      effect: customEffect
    }
  ]
};
```

## 预设配置详解

### 1. `strong` - 强化淡入淡出
- **透明度范围**: [0.2, 1] (20% - 100%)
- **过渡时间**: 600ms
- **适用场景**: 需要明显但不突兀的状态切换
- **特点**: 保持自然感的同时增强可见度

### 2. `dramatic` - 戏剧化效果
- **透明度范围**: [0.1, 1] (10% - 100%)
- **过渡时间**: 800ms
- **缓动函数**: 弹性缓动
- **适用场景**: 重要状态转换、技能释放等
- **特点**: 最强烈的视觉冲击，配合缩放和弹性效果

### 3. `natural` - 自然柔和
- **透明度范围**: [0.5, 1] (50% - 100%)
- **过渡时间**: 500ms
- **适用场景**: 日常状态切换，保持沉浸感
- **特点**: 最自然的过渡效果

### 4. `quick` - 快速切换
- **透明度范围**: [0.4, 1] (40% - 100%)
- **过渡时间**: 300ms
- **适用场景**: 快节奏动作、连击等
- **特点**: 快速但明显

### 5. `character` - 角色动画专用
- **透明度范围**: [0.25, 1] (25% - 100%)
- **过渡时间**: 600ms
- **缩放范围**: [0.92, 1.05] (轻微放大)
- **适用场景**: 角色状态切换优化
- **特点**: 专为角色动画平衡的效果

## 角色动画切换最佳实践

### 待机 → 动作切换
```typescript
{
  id: 'idle_to_action',
  from: 'idle',
  to: 'action',
  condition: { type: 'immediate' },
  effect: {
    ...FADE_PRESETS.character,
    duration: 500 // 稍快一些的响应
  }
}
```

### 动作 → 待机切换
```typescript
{
  id: 'action_to_idle',
  from: 'action',
  to: 'idle',
  condition: { type: 'animationEnd' }, // 动画完成后自动切换
  effect: FADE_PRESETS.natural // 更柔和的回归
}
```

### 连续动作切换
```typescript
{
  id: 'walk_to_run',
  from: 'walk',
  to: 'run',
  condition: { type: 'immediate' },
  effect: FADE_PRESETS.quick // 快速切换保持流畅
}
```

## 组合效果使用

### 淡入淡出 + 缩放
```typescript
const fadeScaleEffect = {
  type: TransitionEffectType.FadeScale,
  duration: 600,
  easing: 'easeOutCubic',
  opacityRange: [0.3, 1],
  scaleRange: [0.9, 1.1] // 放大10%
};
```

### 自定义缓动函数
```typescript
const elasticEffect = {
  type: TransitionEffectType.Fade,
  duration: 800,
  easing: 'easeOutElastic', // 弹性缓动
  opacityRange: [0.2, 1]
};
```

## 性能考虑

1. **透明度范围**: 最小值不要低于0.1，完全透明可能影响视觉连续性
2. **过渡时间**: 建议在300-800ms之间，过长会影响响应性
3. **组合效果**: FadeScale会比纯Fade多消耗一些性能
4. **批量切换**: 避免同时触发多个状态机的过渡

## 调试技巧

启用调试模式查看过渡详情：
```typescript
const config = {
  // ... 其他配置
  debug: true // 启用调试日志
};
```

调试信息会显示：
- 过渡进度
- 当前透明度值
- 动画切换时机
- 状态变化日志

## 故障排除

### 效果不明显
- 检查opacityRange配置
- 确认材质支持透明度
- 验证渲染器设置

### 过渡生硬
- 增加过渡时间
- 使用更平滑的缓动函数
- 调整透明度范围

### 性能问题
- 减少同时过渡的状态机数量
- 使用更简单的效果类型
- 优化过渡时间

## 总结

通过使用这些增强的配置和预设，您可以：

- **增强视觉冲击力**: 使用更强的透明度对比度
- **提升用户体验**: 选择适合场景的过渡效果
- **保持性能**: 合理配置过渡参数
- **简化开发**: 使用预设快速实现效果

更多详细信息请参考：
- [动画状态机系统架构](../architecture/animation-state-machine.md)
- [API参考](../reference/api-summary.md)