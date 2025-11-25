# 渲染管线架构

本文档描述PBR Visualizer SDK的渲染管线架构,包括四阶段渲染流程、着色器系统和后处理。

## 概述

PBR Visualizer采用四阶段渲染管线,实现照片级真实感的物理基础渲染(PBR)。管线设计基于`docs/架构.md`和`docs/shader.md`的规范,目前正在进行重构以实现文档与代码的统一。

## 四阶段渲染管线

### 阶段1: 环境生成

生成用于IBL(Image-Based Lighting)的环境贴图。

**输入**:
- HDR全景图 (equirectangular格式)
- 程序化参数 (噪波球体)
- 渐变天空盒配置

**处理**:
- **HDR模式**: 加载RGBE格式的360°全景图
- **噪波球体模式**: 使用`DynamicNoiseSphere`着色器实时生成动态背景
- **程序化天空**: 渐变算法生成简单天空盒

**输出**: 环境源纹理 (2D或Cube格式)

**关键着色器**: `DynamicNoiseSphere.glsl`

### 阶段2: PMREM预计算

将环境贴图转换为预过滤的多级mipmap辐射环境贴图(Prefiltered Mipmap Radiance Environment Map)。

**输入**: 阶段1的环境源纹理

**处理**:
1. **Equirect → CubeUV转换**: 使用`EquirectangularToCubeUV`着色器将全景图转换为立方体贴图
2. **球面高斯模糊**: 对不同粗糙度级别应用`SphericalGaussianBlur`
3. **Mipmap生成**: 生成多级详细程度的环境贴图

**输出**: 过滤的立方体贴图纹理,用于IBL

**关键着色器**:
- `EquirectangularToCubeUV.glsl`
- `SphericalGaussianBlur.glsl`

**性能指标** (根据设备):
- 高端设备: 1024px, 20采样, ~45ms
- 中端设备: 512px, 12采样, ~80ms
- 移动设备: 256px, 6采样, ~150ms

### 阶段3: PBR主渲染

使用物理材质和IBL光照渲染场景。

**输入**:
- 3D场景模型
- PBR材质参数
- PMREM环境贴图
- 灯光配置

**处理**:
- **材质系统**: 应用PBR材质 (color, roughness, metalness)
- **IBL光照**: 使用PMREM贴图进行基于图像的光照
- **阴影系统**: 动态blob阴影或传统阴影映射
- **灯光**: 组合使用环境光、方向光、区域光

**输出**: HDR帧缓冲

**Three.js集成**:
```typescript
// 材质配置
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.2,
  metalness: 0.9,
  envMapIntensity: 1.0
});

// 场景环境
scene.environment = pmremTexture;
```

### 阶段4: 后处理

应用后处理效果,输出最终画面。

**输入**: 阶段3的HDR帧缓冲

**处理**:
- **色调映射**: ACES色调映射或简单Gamma校正
- **SSAO**: 屏幕空间环境光遮蔽 (可选)
- **泛光**: 自适应bloom效果 (可选)
- **抗锯齿**: FXAA或SMAA (可选)

**输出**: LDR最终画面 (显示到屏幕)

**后处理库**: 使用 `postprocessing` 库

```typescript
import { EffectComposer, RenderPass, SSAOPass } from 'postprocessing';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new SSAOPass(scene, camera));
```

## 核心着色器系统

### 1. DynamicNoiseSphere

**用途**: 生成程序化动态噪波球体作为环境背景

**技术细节**:
- 类型: `THREE.ShaderMaterial`
- 渲染目标: 全屏四边形或球体
- 噪波算法: 分形布朗运动 (Fractal Brownian Motion)
- 动态效果: 时间驱动的脉冲和旋转

**参数**:
```glsl
uniform float time;        // 动画时间
uniform float radius;      // 球体半径
uniform bool pulse;        // 是否启用脉冲效果
uniform vec3 color1;       // 颜色1
uniform vec3 color2;       // 颜色2
```

**输出**: 渲染到`WebGLRenderTarget`,用作环境源

**文档位置**: `docs/shader.md` 第2节

### 2. EquirectangularToCubeUV

**用途**: 将等距圆柱投影(全景图)转换为立方体贴图

**技术细节**:
- 类型: `THREE.ShaderMaterial`
- 输入格式: Equirectangular (2:1宽高比)
- 输出格式: CubeMap (6个面)
- 坐标系: 右手坐标系

**核心算法**:
```glsl
// 顶点着色器: 计算立方体方向向量
vec3 getDirection(vec2 uv, float face) {
  // 根据面索引计算方向
}

// 片段着色器: 采样equirect纹理
vec2 equirectUv = directionToEquirectUV(vOutputDirection);
vec4 color = texture2D(envMap, equirectUv);
```

**性能**: ~5ms (1024px, 桌面)

**文档位置**: `docs/shader.md` 第1节

### 3. SphericalGaussianBlur

**用途**: 对球面环境贴图应用物理精确的高斯模糊

**技术细节**:
- 类型: `THREE.ShaderMaterial`
- 卷积核: 球面高斯核
- 各向异性支持: 可沿特定轴模糊
- Roughness映射: 粗糙度值映射到mip级别

**参数**:
```glsl
uniform samplerCube envMap;
uniform float roughness;      // 0.0-1.0
uniform int samples;          // 采样数量
uniform vec3 anisotropyAxis;  // 各向异性轴
```

**用途场景**:
- 高精度模式: 替代Three.js内置PMREM
- 自定义过滤: 实现特殊艺术效果

**文档位置**: `docs/shader.md` 第3节

## 当前重构状态

### 文档与实现差异

根据 `.trae/documents/重构渲染管线与着色器集成方案.md`:

**问题**:
1. ✗ 着色器代码内联在`Renderer.ts`中,未模块化
2. ✗ 环境系统重复,`PBRVisualizer`和`Renderer`各自维护
3. ✗ PMREM触发两次 (先`fromScene`,再`generatePMREM`)
4. ✗ 自定义着色器与文档规范不一致
5. ✗ `docs/shader.ts`未导出,运行时未引用

**重构目标**:
1. ✓ 模块化着色器: 新建`src/shaders/`导出材质工厂函数
2. ✓ 统一环境系统: 仅`Renderer`持有,`PBRVisualizer`调用
3. ✓ 单次PMREM: 合并生成逻辑,避免重复
4. ✓ 对齐文档: 使用`docs/shader.md`的GLSL规范
5. ✓ 清理职责: 简化`updateMaterialIBL`,避免每帧重置

### 目标架构

```
src/
  shaders/
    DynamicNoiseSphere.ts      # 导出 createNoiseSphereMaterial()
    EquirectToCubeUV.ts        # 导出 createEquirectToCubeMaterial()
    SphericalGaussianBlur.ts   # 导出 createSphericalGaussianBlurMaterial()
  core/
    Renderer.ts                # 统一环境管线
    PBRVisualizer.ts           # 调用 renderer.updateEnvironment()
```

## 渲染流程图

```
[用户配置]
    ↓
[环境配置] → [EnvironmentSystem]
    ↓              ↓
    ↓         [生成环境源]
    ↓              ↓
    ↓    ┌─────────┴──────────┐
    ↓    ↓                    ↓
    ↓  [HDR加载]        [噪波球体生成]
    ↓    ↓                    ↓
    ↓    └─────────┬──────────┘
    ↓              ↓
    ↓    [EquirectToCubeUV转换]
    ↓              ↓
    ↓    [SphericalGaussianBlur/PMREM]
    ↓              ↓
    ↓         [PMREM纹理]
    ↓              ↓
    ↓    ┌─────────┴─────────┐
    ↓    ↓                   ↓
[材质更新] ← [scene.environment] → [IBL光照]
    ↓
[PBR主渲染]
    ↓
[后处理]
    ↓
[最终输出]
```

## 性能优化

### 质量分级

根据`docs/架构.md`第4.1节:

| 设备类型 | 分辨率 | PMREM采样 | Mip级别 | 后处理 |
|---------|--------|-----------|---------|--------|
| 高端 (RTX) | 1.0 | 20 | 7 | ACES+泛光 |
| 中端 (GTX) | 0.85 | 12 | 5 | ACES |
| 移动 (骁龙) | 0.7 | 6 | 3 | Gamma |

### 缓存策略

- PMREM纹理缓存,避免重复生成
- 着色器变体预编译
- 几何体和材质复用

### 内存管理

```typescript
// 及时dispose资源
pmremTexture.dispose();
renderTarget.dispose();
material.dispose();
geometry.dispose();
```

## 相关文档

- **架构设计**: `docs/架构.md` - 完整系统架构和性能指标
- **着色器规范**: `docs/shader.md` - 三个核心着色器的GLSL代码和数学原理
- **重构方案**: `.trae/documents/重构渲染管线与着色器集成方案.md` - 当前重构计划

## 下一步

参考以下指南了解如何使用渲染管线:

- `guides/rendering-setup.md` - 渲染管线配置指南 (待创建)
- `guides/custom-shaders.md` - 自定义着色器指南 (待创建)
- `reference/shader-api.md` - 着色器API参考 (待创建)
