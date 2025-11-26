<!-- 这个报告分析了 src/types/core.ts 文件中定义的所有接口和参数的使用情况 -->

### Code Sections (The Evidence)

- `src/types/core.ts` (656行) - 包含所有核心接口定义
- `src/PBRVisualizer.ts` (主要使用入口) - 使用了大部分核心接口
- `src/core/EnvironmentSystem.ts` (100行) - 使用EnvironmentConfig和部分GlobalState
- `src/core/LightSystem.ts` (100行) - 使用LightState和相关配置
- `src/core/PostProcessSystem.ts` (100行) - 使用PostProcessState和相关配置
- `src/core/MaterialSystem.ts` (100行) - 使用MaterialState
- `src/core/AnimationStateMachine.ts` (100行) - 使用动画状态机相关接口
- `src/core/DebugSystem.ts` (100行) - 使用DebugConfig和相关调试接口
- `demo/` 目录 (使用示例) - 部分接口在demo中有使用

### Report (The Answers)

#### result

通过对 `src/types/core.ts` 文件的全面分析，发现了以下几类无用或可疑的参数：

**完全未被引用的接口 (无用):**

1. `BatchOptions` (313-320行) - 定义了duration, easing, description字段，但在整个代码库中从未被使用
2. `TransitionOptions` (323-330行) - 定义了duration, easing, interpolate字段，但在整个代码库中从未被使用
3. `ColorGradient` (333-341行) - 定义了渐变相关字段，但在整个代码库中从未被使用
4. `StateChangeEvent` (344-351行) - 定义了状态变更事件字段，但在整个代码库中从未被使用
5. `ModelLoadedEvent` (353-360行) - 定义了模型加载事件字段，但在整个代码库中从未被使用

**只有部分字段被使用的接口 (部分无用):** 6. `LightState.size` (37行) - 只在LightSystem中被使用，但定义时标记为可选7. `CameraState.target` (53行) - 只在设置相机时使用一次，功能重复8. `CameraState.controls` (61行) - 其内部字段大部分未被使用9. `MaterialState.metallicRoughnessMap` (149行) - 存在重复定义（metallicRoughnessMap vs metalnessMap+roughnessMap）10. `DebugConfig.lightHelpers.lightIds` (440行) - 在整个代码库中从未被实际过滤使用11. `DebugConfig.performance.showPassTimings` (462行) - 在整个代码库中从未被使用

**为未来功能预留但未实现的参数 (过度设计):** 12. `LightState.size` - 定义了矩形区域灯光大小，但功能简单，可能过度设计 13. `VignetteConfig` 多个参数 - 如vignetteRange、ringRadius、noiseIntensity等参数功能重叠14. `StateMachineConfig` 中的一些高级配置如debug、defaultEffect等

#### conclusions

1. **事件系统接口大部分未被使用**: `StateChangeEvent`、`ModelLoadedEvent`、`ErrorEvent` 等事件接口虽然定义完整，但在实际代码中几乎没有使用，表明事件系统可能被过度设计。

2. **批量操作接口未实现**: `BatchOptions` 和 `TransitionOptions` 接口定义了批量更新和过渡效果的配置，但在整个代码库中从未被调用，说明这些高级功能尚未实现。

3. **相机状态存在冗余**: `CameraState.target` 字段与相机lookAt功能重复，可能导致配置冗余。

4. **调试系统部分字段未使用**: 调试配置中的一些高级功能如`showPassTimings`、`lightIds`过滤等定义了但未实现。

5. **材质纹理映射存在歧义**: `metallicRoughnessMap` 与 `metalnessMap`、`roughnessMap` 同时存在，可能导致开发困惑。

#### relations

1. **事件系统与状态管理的关系**: `StateChangeEvent`、`ModelLoadedEvent`、`ErrorEvent` 接口定义了完整的事件载荷结构，但与实际的状态管理系统（StateTransaction）缺乏集成，表明事件系统可能是为未来功能预留的。

2. **批量操作与事务系统的关系**: `BatchOptions` 和 `TransitionOptions` 接口与 `StateTransaction` 事务系统处于同一层级，但缺乏实际实现，表明批量更新功能可能还在规划中。

3. **调试系统与渲染系统的关系**: `DebugConfig` 中的 `showPassTimings` 字段与后处理渲染管线相关，但与实际的渲染性能监控缺乏集成，表明部分调试功能可能被过度设计。

4. **材质系统与纹理映射的关系**: `MaterialState` 中的纹理映射字段与实际的材质创建逻辑存在复杂关系，特别是`metallicRoughnessMap`字段的使用逻辑需要澄清。

5. **相机控制与用户交互的关系**: `CameraState.controls` 字段与OrbitControls系统的集成程度较低，表明用户交互控制可能存在设计冗余。
