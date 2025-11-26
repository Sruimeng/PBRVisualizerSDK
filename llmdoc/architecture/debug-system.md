# Debug系统架构

## 1. Identity

- **What it is**: 统一的调试框架，集成灯光Helper可视化、Buffer调试和性能监控的实时调试面板
- **Purpose**: 在开发和优化阶段提供可视化调试工具，支持灯光设置、渲染效果和性能分析

## 2. 核心组件

- `src/core/DebugSystem.ts` (DebugSystem): 调试系统主类，管理lil-gui调试面板、灯光Helper、Buffer可视化和性能监控
- `src/core/LightSystem.ts` (setHelpersEnabled, createAllHelpers, getAllHelperInfo, setHelperScale): 灯光Helper功能，支持4种Helper类型和Studio三点布光可视化
- `src/core/PostProcessSystem.ts` (setSSAOOutputMode, cycleOutputMode, resetOutputMode): Buffer可视化功能，支持5种输出模式
- `src/PBRVisualizer.ts` (debug getter): 主类Debug API暴露接口
- `src/types/core.ts` (DebugConfig, DebugState, SSAOOutputMode, LightHelperInfo): Debug系统类型定义

## 3. 执行流程（LLM检索地图）

### 初始化流程

- **1. 系统创建**: `PBRVisualizer:113-135` - 在主类中创建DebugSystem实例，传入LightSystem和PostProcessSystem
- **2. 配置传递**: `DebugSystem:53-79` - 接收初始配置，若配置启用则自动调用enable()
- **3. 默认配置**: `DebugSystem:84-102` - 设置默认配置，包括Helper、Buffer、性能监控设置

### 启用Debug模式

- **1. 启用调用**: `DebugSystem:107-122` - 调用enable()方法，标记isEnabled=true，创建lil-gui面板
- **2. 面板创建**: `DebugSystem:177-205` - 创建GUI容器，初始化3个文件夹：灯光Helper、Buffer可视化、后处理、性能
- **3. UI绑定**: `DebugSystem:210-218` - 同步UI控制对象与当前状态，建立双向绑定
- **4. 性能更新**: `DebugSystem:311-324` - 启动requestAnimationFrame循环，实时更新性能指标

### 灯光Helper工作流

- **1. 创建Helper**: 调用`setLightHelpersEnabled(true)` → `LightSystem:504-512` - 为所有灯光创建Helper对象
- **2. Helper创建细节**: `LightSystem:455-484` - 根据灯光类型创建对应Helper（RectAreaLight/PointLight/SpotLight/DirectionalLight）
- **3. Studio灯光Helper**: `LightSystem:517-538` - 为Studio三点布光创建RectAreaLightHelper，可视化布光配置
- **4. 可见性控制**: `LightSystem:430-442` - setHelpersEnabled()控制所有Helper的visible属性

### Buffer可视化工作流

- **1. 模式设置**: `DebugSystem:370-377` - setBufferVisualizationMode()设置SSAO输出模式
- **2. 模式应用**: `PostProcessSystem:312-324` - setSSAOOutputMode()将模式值传入SSAOPass.output
- **3. 模式切换**: `DebugSystem:382-388` - cycleBufferMode()循环切换5种模式（Default、SSAO、Blur、Depth、Normal）
- **4. 可用模式**: `PostProcessSystem:336-344` - getAvailableOutputModes()返回可视化模式列表

### 性能监控工作流

- **1. 性能获取**: `DebugSystem:311-324` - 通过requestAnimationFrame定期调用getPerformanceStats()
- **2. 数据更新**: 性能统计包含fps、drawCalls、triangles，由Renderer.ts收集并实时更新
- **3. UI显示**: 性能数据绑定到lil-gui的监听属性，实时显示在面板中

## 4. 设计要点

### 模块独立性
- DebugSystem 是Debug功能的统一入口，不修改核心系统行为
- LightSystem 和 PostProcessSystem 的Debug API 独立，可单独使用或集成到DebugSystem
- Helper和Buffer可视化功能自包含，不影响渲染质量

### 配置与状态同步
- DebugConfig 定义配置，DebugState 用于状态查询
- syncUIControls() 确保UI与系统状态保持同步，防止不一致
- lil-gui的onChange回调与DebugSystem方法绑定，实现双向同步

### 性能考虑
- Helper创建是按需的（createAllHelpers），不自动创建所有灯光Helper
- requestAnimationFrame循环仅在调试模式启用且有GUI时执行
- Buffer可视化模式切换不需要重新编译着色器，通过SSAOPass的output属性实时切换

### Helper类型支持
- RectAreaLightHelper：矩形区域灯光，特别用于Studio三点布光的可视化
- PointLightHelper：点光源可视化
- SpotLightHelper：聚光灯可视化
- DirectionalLightHelper：平行光可视化

### Buffer输出模式
- **Default (0)**: 合成后的最终输出（关闭Buffer调试）
- **SSAO (1)**: 原始SSAO纹理（查看阴影效果）
- **Blur (2)**: 模糊后的SSAO（查看模糊效果）
- **Depth (3)**: 深度Buffer（调试深度信息）
- **Normal (4)**: 法线Buffer（调试法线计算）
