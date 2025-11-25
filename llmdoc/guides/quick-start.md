# 快速开始 - 5分钟上手PBR Visualizer SDK

## 1. 准备工作

### 安装SDK
```bash
npm install pbr-visualizer-sdk
# 或
yarn add pbr-visualizer-sdk
# 或
pnpm add pbr-visualizer-sdk
```

### 基本HTML结构
```html
<!DOCTYPE html>
<html>
<head>
    <title>PBR Visualizer Demo</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #canvas { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="canvas"></div>
    <script type="module" src="main.js"></script>
</body>
</html>
```

## 2. 初始化SDK

### 基础初始化
```javascript
// main.js
import { PBRVisualizer } from 'pbr-visualizer-sdk';

// 创建PBR Visualizer实例
const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas'),
    // 基础配置
    quality: 'high',           // 渲染质量: 'low', 'medium', 'high'
    autoRotate: true,           // 自动旋转
    enableStats: true,          // 性能统计
    shadows: true,             // 阴影效果
    antialias: true            // 抗锯齿
});
```

### 高级配置
```javascript
const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas'),

    // 渲染质量设置
    quality: 'high',
    pixelRatio: window.devicePixelRatio,

    // 环境设置
    environment: {
        type: 'studio',        // 'studio', 'hdr', 'gradient'
        intensity: 1.0,
        background: '#1a1a1a'
    },

    // 后处理设置
    postProcessing: {
        ssao: { enabled: true, intensity: 0.5 },
        bloom: { enabled: true, intensity: 0.3 },
        toneMapping: 'aces'
    },

    // 性能监控
    performance: {
        stats: true,
        fps: 60,
        memoryMonitoring: true
    }
});
```

## 3. 加载第一个3D模型

### 基础模型加载
```javascript
// 加载GLTF模型
async function loadModel() {
    try {
        const model = await visualizer.loadModel('/path/to/your/model.gltf');

        // 设置模型位置和大小
        visualizer.setModelPosition(model, { x: 0, y: 0, z: 0 });
        visualizer.setModelScale(model, { x: 1, y: 1, z: 1 });

        console.log('模型加载成功:', model);
        return model;
    } catch (error) {
        console.error('模型加载失败:', error);
    }
}

// 调用加载函数
loadModel();
```

### 优化模型加载
```javascript
async function loadModelOptimized() {
    try {
        // 配置加载选项
        const loadOptions = {
            draco: true,                    // 启用Draco压缩
            optimize: true,                 // 优化模型
            center: true,                   // 居中模型
            scale: 1.0,                     // 缩放比例
            computeBoundingBox: true,       // 计算包围盒
            generateStudioLighting: true    // 生成Studio布光
        };

        const model = await visualizer.loadModel('/path/to/model.gltf', loadOptions);

        // 设置模型可见性
        visualizer.setModelVisible(model, true);

        return model;
    } catch (error) {
        console.error('模型加载失败:', error);
    }
}
```

## 4. 配置材质和光照

### 快速材质配置
```javascript
// 设置材质参数
function configureMaterial(model) {
    const materialParams = {
        metalness: 0.5,        // 金属度: 0-1
        roughness: 0.3,        // 粗糙度: 0-1
        color: '#ffffff',      // 基础颜色
        envMapIntensity: 1.0, // 环境贴图强度
        clearcoat: 0.0,        // 清漆层: 0-1
        clearcoatRoughness: 0.0 // 清漆粗糙度
    };

    visualizer.setModelMaterial(model, materialParams);
}
```

### Studio布光设置
```javascript
// 配置Studio三点布光
function setupStudioLighting() {
    const lightingConfig = {
        keyLight: {
            intensity: 1.0,
            color: '#ffffff',
            position: { x: 1, y: 2, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        fillLight: {
            intensity: 0.5,
            color: '#ffcccc',
            position: { x: -1, y: 1, z: -2 }
        },
        rimLight: {
            intensity: 0.3,
            color: '#ccccff',
            position: { x: 0, y: -1, z: 2 }
        }
    };

    visualizer.createStudioLighting(lightingConfig);
}
```

### 环境配置
```javascript
// 设置HDR环境
async function setupEnvironment() {
    try {
        // 加载HDR环境贴图
        await visualizer.loadEnvironmentHDRI('/path/to/environment.hdr');

        // 或使用预设环境
        await visualizer.setEnvironment('studio');

        // 调整环境强度
        visualizer.setEnvironmentIntensity(1.0);

    } catch (error) {
        console.error('环境设置失败:', error);
    }
}
```

## 5. 设置后处理效果

### 基础后处理
```javascript
// 配置后处理效果
function setupPostProcessing() {
    // SSAO接触阴影
    visualizer.setSSAO({
        enabled: true,
        intensity: 0.5,
        radius: 0.5,
        bias: 0.01
    });

    // Bloom泛光
    visualizer.setBloom({
        enabled: true,
        intensity: 0.3,
        threshold: 0.85,
        radius: 0.4
    });

    // 色调映射
    visualizer.setToneMapping('aces');

    // 抗锯齿
    visualizer.setAntialias(true);
}
```

### 高级后处理
```javascript
// 完整后处理配置
function setupAdvancedPostProcessing() {
    visualizer.configurePostProcessing({
        ssao: {
            enabled: true,
            intensity: 0.7,
            radius: 0.8,
            bias: 0.01,
            resolution: 0.5
        },
        bloom: {
            enabled: true,
            intensity: 0.4,
            threshold: 0.8,
            radius: 0.6,
            luminanceMaterial: undefined,
            mipmapMaterial: undefined,
            resolution: 256,
            smoothing: 0.01
        },
        toneMapping: {
            enabled: true,
            type: 'aces',
            exposure: 1.0,
            whitePoint: 1.0
        },
       FXAA: {
            enabled: true,
            pixelRatio: 0.25
        }
    });
}
```

## 6. 相机控制

### 相机设置
```javascript
// 配置相机
function setupCamera() {
    // 设置相机位置
    visualizer.setCameraPosition({ x: 2, y: 2, z: 5 });

    // 设置相机目标
    visualizer.setCameraTarget({ x: 0, y: 0, z: 0 });

    // 设置相机参数
    visualizer.setCameraParameters({
        fov: 50,
        near: 0.1,
        far: 1000,
        aspect: window.innerWidth / window.innerHeight
    });
}
```

### 相机控制
```javascript
// 启用/禁用相机控制
function setupCameraControls() {
    // 启用轨道控制
    visualizer.enableOrbitControls(true);

    // 设置控制参数
    visualizer.setOrbitControls({
        enableDamping: true,
        dampingFactor: 0.05,
        enableZoom: true,
        enableRotate: true,
        enablePan: true,
        autoRotate: true,
        autoRotateSpeed: 2.0
    });
}
```

## 7. 完整示例

### 完整的快速开始代码
```javascript
// main.js
import { PBRVisualizer } from 'pbr-visualizer-sdk';

// 初始化PBR Visualizer
const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas'),
    quality: 'high',
    autoRotate: true,
    enableStats: true,
    environment: {
        type: 'studio',
        intensity: 1.0
    },
    postProcessing: {
        ssao: { enabled: true, intensity: 0.5 },
        bloom: { enabled: true, intensity: 0.3 }
    }
});

// 加载模型和配置场景
async function setupScene() {
    try {
        // 加载模型
        const model = await visualizer.loadModel('/path/to/model.gltf', {
            draco: true,
            optimize: true,
            generateStudioLighting: true
        });

        // 配置材质
        visualizer.setModelMaterial(model, {
            metalness: 0.5,
            roughness: 0.3,
            color: '#ffffff'
        });

        // 设置相机
        visualizer.setCameraPosition({ x: 3, y: 3, z: 5 });
        visualizer.setCameraTarget({ x: 0, y: 0, z: 0 });

        // 启用相机控制
        visualizer.enableOrbitControls(true);

        console.log('场景配置完成');

    } catch (error) {
        console.error('场景设置失败:', error);
    }
}

// 启动应用
setupScene();
```

## 8. 验证安装

### 检查渲染效果
1. 打开浏览器控制台，查看是否有错误信息
2. 检查页面是否正确显示了3D模型
3. 观察性能统计面板（如果启用）
4. 确认相机控制是否正常工作

### 调试技巧
```javascript
// 启用调试模式
visualizer.enableDebugMode(true);

// 获取系统状态
const systemState = visualizer.getSystemState();
console.log('系统状态:', systemState);

// 检查性能信息
const performanceInfo = visualizer.getPerformanceInfo();
console.log('性能信息:', performanceInfo);
```

## 9. 下一步

### 继续学习
- [API初始化配置](api-setup.md) - 深入了解初始化选项
- [基础渲染工作流](basic-rendering-workflow.md) - 掌握渲染流程
- [材质和光照配置](material-and-lighting-configuration.md) - 学习材质和光照设置
- [状态更新基础](state-updates-basics.md) - 了解状态管理

### 常见问题
- **模型加载失败**: 检查文件路径和网络连接
- **性能问题**: 降低渲染质量或简化场景
- **显示异常**: 检查浏览器WebGL支持
- **材质异常**: 确认材质参数范围（0-1）

恭喜！您已成功完成PBR Visualizer SDK的快速入门。现在您可以开始创建更复杂的3D可视化应用了。