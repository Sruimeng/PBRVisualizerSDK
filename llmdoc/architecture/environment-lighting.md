# 环境与光照系统

本文档描述PBR Visualizer SDK的环境系统和光照架构,包括HDR环境、动态环境生成和灯光配置。

## 概述

PBR Visualizer的环境与光照系统负责为3D场景提供基于图像的光照(IBL)和补充光源。系统支持三种环境模式和多种灯光类型,可灵活组合以实现不同的渲染效果。

## EnvironmentSystem类

环境系统负责生成和管理环境贴图。

### 类结构

```typescript
class EnvironmentSystem {
  constructor(quality: QualityConfig, renderer: THREE.WebGLRenderer);

  // 生成环境
  generateEnvironment(config: EnvironmentConfig): Promise<THREE.Texture>;

  // HDR加载
  loadHDREnvironment(url: string): Promise<THREE.Texture>;

  // 程序化环境
  generateProceduralEnvironment(config: ProceduralConfig): THREE.Texture;

  // 清理
  dispose(): void;
}
```

### 质量配置

根据设备性能调整环境贴图质量:

```typescript
interface QualityConfig {
  resolution: number;       // 渲染分辨率倍数 (0.5-1.0)
  maxSamples: number;       // PMREM最大采样数
  mipLevels: number;        // Mipmap级别数
  useHighPrecision: boolean; // 使用高精度纹理
}

// 质量预设
const qualityPresets = {
  high: { resolution: 1.0, maxSamples: 20, mipLevels: 7, useHighPrecision: true },
  medium: { resolution: 0.85, maxSamples: 12, mipLevels: 5, useHighPrecision: false },
  low: { resolution: 0.7, maxSamples: 6, mipLevels: 3, useHighPrecision: false }
};
```

## 环境模式

### 1. HDR环境

使用真实HDR环境贴图提供基于图像的光照。

**加载流程**:

```typescript
// 1. 加载HDR文件
const rgbeLoader = new RGBELoader();
const hdrTexture = await rgbeLoader.loadAsync('/environments/studio.hdr');

// 2. 转换为CubeUV格式
const cubeUV = environmentSystem.equirectToCubeUV(hdrTexture);

// 3. 生成PMREM
const pmremTexture = pmremGenerator.fromCubemap(cubeUV);

// 4. 应用到场景
scene.environment = pmremTexture.texture;
```

**文件格式**: RGBE (.hdr)

**推荐来源**:
- [Poly Haven](https://polyhaven.com/hdris) - 免费HDR环境
- [HDR Haven](https://hdrihaven.com/) - 高质量HDR集合

**分辨率建议**:
- 桌面: 2048x1024 或 4096x2048
- 移动: 1024x512 或更小

**性能指标**:
- 加载时间: ~200-500ms (2K HDR)
- PMREM生成: ~45ms (高端GPU)
- 内存占用: ~20-40MB (2K, 7 mip级别)

### 2. 噪波球体环境

使用程序化着色器实时生成动态环境。

**生成流程**:

```typescript
// 1. 创建着色器材质
const noiseMaterial = createNoiseSphereMaterial({
  radius: 0.8,
  pulse: true,
  color1: new THREE.Color('#1a1a2e'),
  color2: new THREE.Color('#16213e'),
  speed: 1.0
});

// 2. 渲染到RT
const renderTarget = new THREE.WebGLRenderTarget(512, 512);
renderer.setRenderTarget(renderTarget);
renderer.render(noiseScene, noiseCamera);

// 3. 生成PMREM
const pmremTexture = pmremGenerator.fromRenderTarget(renderTarget);

// 4. 应用到场景
scene.environment = pmremTexture.texture;
```

**着色器参数**:

```glsl
uniform float time;        // 动画时间
uniform float radius;      // 球体半径 (0-1)
uniform bool pulse;        // 启用脉冲效果
uniform vec3 color1;       // 主色调
uniform vec3 color2;       // 次色调
uniform float speed;       // 动画速度
```

**噪波算法**: 分形布朗运动 (Fractal Brownian Motion)

```glsl
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}
```

**优势**:
- 无需外部文件,减少加载时间
- 包体积小
- 动态效果,增强视觉吸引力
- 可实时调整参数

**适用场景**:
- 抽象产品展示
- 科技感界面
- 性能受限环境

### 3. 程序化天空

简单的渐变天空盒。

**生成方式**:

```typescript
// 1. 创建渐变材质
const skyGeometry = new THREE.BoxGeometry(100, 100, 100);
const skyMaterial = new THREE.ShaderMaterial({
  vertexShader: skyVert,
  fragmentShader: skyFrag,
  uniforms: {
    topColor: { value: new THREE.Color('#ffffff') },
    bottomColor: { value: new THREE.Color('#87ceeb') }
  },
  side: THREE.BackSide
});

// 2. 使用CubeCamera捕获
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
cubeCamera.update(renderer, skyScene);

// 3. 生成PMREM
const pmremTexture = pmremGenerator.fromCubemap(cubeRenderTarget.texture);
```

**性能**: 最快,适合低端设备

## PMREM生成

### PMREM概念

Prefiltered Mipmap Radiance Environment Map (预过滤Mipmap辐射环境贴图) 是一种为不同粗糙度级别预计算的环境贴图。

**工作原理**:
- Mip level 0: 镜面反射 (roughness = 0)
- Mip level 1-6: 逐渐模糊 (roughness = 0.2-1.0)
- PBR材质根据roughness采样对应mip级别

### Three.js PMREMGenerator

使用Three.js内置生成器:

```typescript
import { PMREMGenerator } from 'three';

const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// 从equirect生成
const pmrem1 = pmremGenerator.fromEquirectangular(hdrTexture);

// 从cubemap生成
const pmrem2 = pmremGenerator.fromCubemap(cubeTexture);

// 从scene生成
const pmrem3 = pmremGenerator.fromScene(scene);

// 使用结果
scene.environment = pmrem1.texture;

// 清理
pmrem1.dispose();
pmremGenerator.dispose();
```

**性能参数**:

```typescript
// 调整采样数量
pmremGenerator.samples = 20;  // 默认256,越高质量越好但越慢
```

### 自定义PMREM (高精度模式)

使用 `SphericalGaussianBlur` 着色器实现物理精确的过滤。

**优势**:
- 更精确的物理模型
- 支持各向异性过滤
- 自定义卷积核

**实现** (参考`docs/shader.md`第3节):

```glsl
// 球面高斯核
float sphericalGaussianKernel(float cosTheta, float sigma) {
  return exp(-cosTheta * cosTheta / (2.0 * sigma * sigma));
}

// 沿纬度卷积
vec3 convolve(samplerCube envMap, vec3 direction, float roughness) {
  vec3 N = normalize(direction);
  vec3 color = vec3(0.0);
  float totalWeight = 0.0;

  // 计算采样半径
  float sigma = roughness * PI / 2.0;

  // 半球采样
  for (int i = 0; i < samples; i++) {
    vec3 L = generateSampleDirection(i, samples);
    float NdotL = max(dot(N, L), 0.0);

    if (NdotL > 0.0) {
      float weight = sphericalGaussianKernel(NdotL, sigma);
      color += textureCube(envMap, L).rgb * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.001);
}
```

**使用条件**:
- `useCustomPMREM: true` 配置项
- 高端GPU
- 需要最高质量

## 灯光系统

### 灯光类型

PBR Visualizer支持多种Three.js灯光:

1. **AmbientLight**: 全局环境光
2. **DirectionalLight**: 方向光 (太阳光)
3. **PointLight**: 点光源
4. **SpotLight**: 聚光灯
5. **RectAreaLight**: 区域光 (柔和工作室灯)

### createLights函数

根据`git log`,`LightManager`已重构为函数式:

```typescript
interface LightConfig {
  ambient?: {
    intensity: number;
    color: string;
  };

  directional?: {
    intensity: number;
    color: string;
    position: [number, number, number];
    castShadow: boolean;
    shadowMapSize?: number;
  };

  rectArea?: Array<{
    width: number;
    height: number;
    intensity: number;
    color: string;
    position: [number, number, number];
    rotation: [number, number, number];
  }>;
}

function createLights(config: LightConfig): THREE.Light[] {
  const lights: THREE.Light[] = [];

  // 环境光
  if (config.ambient) {
    const ambient = new THREE.AmbientLight(
      config.ambient.color,
      config.ambient.intensity
    );
    lights.push(ambient);
  }

  // 方向光
  if (config.directional) {
    const directional = new THREE.DirectionalLight(
      config.directional.color,
      config.directional.intensity
    );
    directional.position.set(...config.directional.position);

    if (config.directional.castShadow) {
      directional.castShadow = true;
      directional.shadow.mapSize.width = config.directional.shadowMapSize || 2048;
      directional.shadow.mapSize.height = config.directional.shadowMapSize || 2048;
    }

    lights.push(directional);
  }

  // 区域光
  if (config.rectArea) {
    RectAreaLightUniformsLib.init();

    config.rectArea.forEach(ra => {
      const rectLight = new THREE.RectAreaLight(
        ra.color,
        ra.intensity,
        ra.width,
        ra.height
      );
      rectLight.position.set(...ra.position);
      rectLight.rotation.set(...ra.rotation);
      lights.push(rectLight);
    });
  }

  return lights;
}
```

### 工作室灯光设置

模拟摄影棚三点布光:

```typescript
const studioLights = createLights({
  // 主光 (Key Light)
  rectArea: [
    {
      width: 10,
      height: 10,
      intensity: 3.0,
      color: '#ffffff',
      position: [5, 5, 0],
      rotation: [-Math.PI/2, 0, 0]
    },
    // 补光 (Fill Light)
    {
      width: 8,
      height: 8,
      intensity: 1.5,
      color: '#ffffff',
      position: [-5, 3, 0],
      rotation: [-Math.PI/3, 0, 0]
    },
    // 背光 (Back Light)
    {
      width: 6,
      height: 6,
      intensity: 2.0,
      color: '#ffffff',
      position: [0, 3, -5],
      rotation: [0, 0, 0]
    }
  ],
  // 基础环境光
  ambient: {
    intensity: 0.3,
    color: '#ffffff'
  }
});

studioLights.forEach(light => scene.add(light));
```

### 动态阴影

#### Blob Shadow (动态投影)

根据`demo/html/ai_studio_code.html`,项目实现了动态blob shadow:

```typescript
// 创建投影平面
const shadowGeometry = new THREE.PlaneGeometry(10, 10);
const shadowMaterial = new THREE.ShadowMaterial({
  opacity: 0.3
});
const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0;
shadowPlane.receiveShadow = true;

// 跟踪模型位置和高度
function updateBlobShadow(model) {
  const bbox = new THREE.Box3().setFromObject(model);
  const center = bbox.getCenter(new THREE.Vector3());
  const height = bbox.max.y - bbox.min.y;

  // 更新投影位置
  shadowPlane.position.x = center.x;
  shadowPlane.position.z = center.z;

  // 根据高度调整投影大小和透明度
  const scale = 1.0 + height * 0.1;
  shadowPlane.scale.set(scale, scale, 1);
  shadowMaterial.opacity = 0.3 * (1.0 - height / 10.0);
}
```

**特点**:
- 跟踪模型位置和高度
- 动态调整投影大小和透明度
- 性能优于传统阴影映射

#### 传统阴影映射

```typescript
// 启用渲染器阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 配置投射阴影的灯光
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

// 模型投射和接收阴影
model.traverse(child => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
  }
});
```

## IBL与灯光组合

### 混合策略

环境光照(IBL)和灯光可以组合使用:

```typescript
// IBL提供全局光照和反射
scene.environment = pmremTexture.texture;

// 补充灯光增强特定区域
const keyLight = new THREE.DirectionalLight('#ffffff', 1.0);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

// 环境光填充阴影
const ambient = new THREE.AmbientLight('#ffffff', 0.3);
scene.add(ambient);
```

### 强度平衡

调整IBL和灯光的相对强度:

```typescript
// 环境强度
scene.environment = pmremTexture.texture;
scene.environmentIntensity = 1.0;  // Three.js r155+

// 或通过材质
material.envMapIntensity = 1.2;  // 增强反射

// 灯光强度
keyLight.intensity = 0.8;  // 降低直接光照
```

**建议比例**:
- 室内: IBL 70%, 灯光 30%
- 室外: IBL 90%, 灯光 10%
- 工作室: IBL 50%, 灯光 50%

## 环境与材质交互

### 粗糙度与环境

```typescript
// 镜面材质: 清晰反射环境
material.roughness = 0.0;
material.envMapIntensity = 1.5;

// 粗糙材质: 模糊反射环境
material.roughness = 0.8;
material.envMapIntensity = 0.8;
```

### 金属度与环境

```typescript
// 金属: 强环境反射,弱漫反射
material.metalness = 1.0;
material.envMapIntensity = 2.0;

// 非金属: 弱环境反射,强漫反射
material.metalness = 0.0;
material.envMapIntensity = 0.5;
```

## 性能优化

### 1. 环境贴图缓存

```typescript
const envCache = new Map<string, THREE.Texture>();

async function loadCachedEnvironment(url: string): Promise<THREE.Texture> {
  if (envCache.has(url)) {
    return envCache.get(url)!;
  }

  const texture = await loadHDREnvironment(url);
  envCache.set(url, texture);
  return texture;
}
```

### 2. 按需生成PMREM

```typescript
// 仅当环境变更时生成PMREM
let currentPMREM: THREE.Texture | null = null;

function updateEnvironment(config: EnvironmentConfig) {
  if (needsUpdate(config)) {
    currentPMREM?.dispose();
    currentPMREM = generatePMREM(config);
    scene.environment = currentPMREM;
  }
}
```

### 3. 质量分级

根据设备自动调整:

```typescript
const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);

const config = isMobile ? {
  resolution: 0.7,
  maxSamples: 6,
  mipLevels: 3
} : {
  resolution: 1.0,
  maxSamples: 20,
  mipLevels: 7
};
```

## 相关文档

- **架构设计**: `docs/架构.md` - 完整环境系统设计
- **着色器规范**: `docs/shader.md` - DynamicNoiseSphere和环境着色器
- **渲染管线**: `architecture/rendering-pipeline.md` - 环境生成在渲染管线中的位置
- **重构方案**: `.trae/documents/重构渲染管线与着色器集成方案.md` - 环境系统重构计划
