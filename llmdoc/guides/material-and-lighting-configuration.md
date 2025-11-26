# 材质和光照配置工作流程

## 高级材质配置

1. **创建自定义材质**

   ```typescript
   // 基础PBR材质
   const customMaterial = visualizer.materialSystem.createMaterial('custom', {
     color: '#cccccc',
     roughness: 0.4,
     metalness: 0.6,
     emissive: '#000000',
     emissiveIntensity: 0.0,
     envMapIntensity: 1.0
   });

   // 带纹理的材质
   const texturedMaterial = visualizer.materialSystem.createMaterial('textured', {
     color: '#ffffff',
     roughness: 0.8,
     metalness: 0.0,
     normalMap: '/textures/normal.jpg',
     aoMap: '/textures/ao.jpg',
     emissiveMap: '/textures/emissive.jpg',
     metallicRoughnessMap: '/textures/mr.jpg'
   });

   // 透明材质（玻璃）
   const glassMaterial = visualizer.materialSystem.createMaterial('glass', {
     color: '#ffffff',
     roughness: 0.0,
     metalness: 0.0,
     transmission: 1.0,      // 完全透射
     transparent: true,      // 启用透明
     opacity: 0.9,           // 透明度
     envMapIntensity: 1.0
   });
   ```

2. **材质预设系统**

   ```typescript
   // 使用预设材质
   const presets = ['metal', 'plastic', 'wood', 'glass', 'fabric'];

   presets.forEach(type => {
     const preset = visualizer.materialSystem.createPresetMaterial(type);
     console.log(`${type} 预设:`, preset);
   });

   // 创建材质变体
   const baseConfig = { color: '#ff0000', roughness: 0.5 };
   const variants = visualizer.materialSystem.createMaterialVariants(baseConfig);

   // 使用变体
   await visualizer.updateModel('product1', {
     material: variants.smooth
   });
   ```

3. **动态材质更新**

   ```typescript
   // 实时更新材质属性
   await visualizer.updateModel('product1', {
     material: {
       roughness: 0.1,    // 光滑表面
       metalness: 1.0,    // 金属材质
       envMapIntensity: 1.5 // 增强反射
     }
   });

   // 批量材质更新
   visualizer.materialSystem.applyMaterialUpdates(modelObject, 'materialId');
   ```

4. **材质性能优化**

   ```typescript
   // 优化模型材质
   visualizer.materialSystem.optimizeModelMaterials(modelObject, environmentTexture);

   // 获取材质统计信息
   const stats = visualizer.materialSystem.getMaterialStats();
   console.log(`缓存材质数: ${stats.cachedMaterials}, 内存使用: ${stats.memoryUsage}MB`);

   // 清理未使用资源
   visualizer.materialSystem.cleanup();
   ```

## 高级光照配置

1. **Studio三点布光系统**

   ```typescript
   // 自动布光（推荐）
   visualizer.lightSystem.createStudioLighting({
     center: new THREE.Vector3(0, 0, 0),
     size: new THREE.Vector3(1, 1, 1),
     radius: 1.5
   });

   // 手动调整灯光强度
   visualizer.lightSystem.adjustStudioIntensity(1.2); // 增强20%
   ```

2. **自定义光源创建**

   ```typescript
   // 矩形区域光（主光）
   visualizer.lightSystem.createLight('keyLight', {
     type: 'rectAreaLight',
     color: '#ffffff',
     intensity: 2.6,
     position: new THREE.Vector3(2, 1, 2),
     size: [2, 2],
     enabled: true
   });

   // 补光
   visualizer.lightSystem.createLight('fillLight', {
     type: 'rectAreaLight',
     color: '#ffeedd',
     intensity: 1.4,
     position: new THREE.Vector3(-1, 0.5, 1),
     size: [2.6, 2.6],
     enabled: true
   });

   // 轮廓光
   visualizer.lightSystem.createLight('rimLight', {
     type: 'rectAreaLight',
     color: '#4c8bf5',
     intensity: 4.0,
     position: new THREE.Vector3(-1, 1, -2),
     size: [2, 2],
     enabled: true
   });
   ```

3. **动态光照控制**

   ```typescript
   // 更新单个光源
   visualizer.lightSystem.updateLight('keyLight', {
     intensity: 3.0,
     color: '#ffffcc'
   });

   // 批量更新光源
   visualizer.lightSystem.updateAllLights({
     keyLight: { intensity: 2.8 },
     fillLight: { intensity: 1.2 },
     rimLight: { enabled: false }
   });

   // 切换光源开关
   visualizer.lightSystem.toggleLight('rimLight');
   ```

4. **环境光照配置**

   ```typescript
   // HDR环境贴图
   await visualizer.environmentSystem.setEnvironment({
     url: '/environments/studio.hdr',
     intensity: 1.0
   });

   // 程序化环境
   visualizer.environmentSystem.createProceduralEnvironment('studio');
   // 可选: 'outdoor' | 'neutral'

   // 更新环境强度
   visualizer.environmentSystem.updateIntensity(1.5);

   // 获取环境信息
   const envInfo = visualizer.environmentSystem.getEnvironmentInfo();
   console.log('环境信息:', envInfo);
   ```

## 复合配置示例

1. **金属材质+高光效果**

   ```typescript
   // 金属材质配置
   await visualizer.updateModel('product1', {
     material: {
       color: '#888888',
       roughness: 0.1,
       metalness: 1.0,
       envMapIntensity: 1.2
     }
   });

   // 增强布光效果
   visualizer.lightSystem.adjustStudioIntensity(1.3);
   visualizer.postProcessSystem.setConfig({
     bloom: {
       enabled: true,
       strength: 0.3,
       radius: 0.4
     }
   });
   ```

2. **玻璃材质+特殊光照**

   ```typescript
   // 玻璃材质配置
   await visualizer.updateModel('product1', {
     material: {
       color: '#ffffff',
       roughness: 0.0,
       metalness: 0.0,
       transmission: 1.0,
       transparent: true,
       opacity: 0.9
     }
   });

   // 柔和的环境光
   visualizer.environmentSystem.createProceduralEnvironment('neutral');
   visualizer.lightSystem.adjustStudioIntensity(0.8);
   ```

3. **织物材质+漫反射**

   ```typescript
   // 织物材质配置
   await visualizer.updateModel('product1', {
     material: {
       color: '#444444',
       roughness: 1.0,
       metalness: 0.0,
       envMapIntensity: 0.3
     }
   });

   // 增强漫反射光照
   visualizer.lightSystem.createLight('diffuseLight', {
     type: 'rectAreaLight',
     color: '#ffffff',
     intensity: 2.0,
     position: new THREE.Vector3(0, 2, 0),
     size: [3, 3],
     enabled: true
   });
   ```

4. **混合材质**（新增支持）
   ```typescript
   // 玻璃金属混合材质
   await visualizer.updateModel('product1', {
     material: {
       color: '#888888',
       roughness: 0.2,
       metalness: 0.8,
       transmission: 0.4,     // 透射支持
       transparent: true,
       opacity: 0.7,
       envMapIntensity: 1.3
     }
   });
   ```

## 配置验证和调试

1. **光照配置验证**

   ```typescript
   // 获取所有灯光信息
   const lightsInfo = visualizer.lightSystem.getAllLightsInfo();
   lightsInfo.forEach(light => {
     console.log(`${light.id}: ${light.type}, 强度: ${light.intensity}`);
   });
   ```

2. **材质配置验证**

   ```typescript
   // 获取材质配置
   const materialConfig = visualizer.materialSystem.getMaterialConfig('materialId');
   console.log('材质配置:', materialConfig);

   // 检查材质使用统计
   const stats = visualizer.materialSystem.getMaterialStats();
   console.log('内存使用:', stats.memoryUsage, 'MB');
   ```

3. **性能监控**
   ```typescript
   // 监听配置变更的性能影响
   visualizer.on('performance', (stats) => {
     if (stats.fps < 30) {
       console.warn('性能警告: FPS低于30');
       // 可以自动降低质量设置
     }
   });
   ```

## 材质编辑器集成

材质编辑器提供了可视化的材质编辑界面，与核心配置系统无缝集成：

### 1. 使用材质编辑器

```typescript
import { MaterialEditorDemo } from './demo/html/material-editor/sdk-simple';

// 初始化材质编辑器
const editor = new MaterialEditorDemo({
    container: document.getElementById('editor'),
    modelSource: './models/sample.glb'
});

await editor.initialize();

// 与核心SDK集成
const visualizer = editor.getVisualizer();

// 在材质编辑器中调整参数后同步到核心系统
editor.on('materialUpdated', (params) => {
    visualizer.updateModel('model', {
        material: params
    });
});
```

### 2. 预设系统集成

```typescript
// 从材质编辑器获取预设
const presets = editor.getPresets();

// 应用预设到核心系统
const preset = presets.find(p => p.name === '金属');
if (preset) {
    await visualizer.updateModel('model', {
        material: preset.params
    });
}

// 将核心系统的预设同步到编辑器
visualizer.materialSystem.getPresets().forEach(preset => {
    editor.addPreset(preset);
});
```

### 3. 高级材质编辑

```typescript
// 清漆材质配置
await visualizer.updateModel('model', {
    material: {
        color: '#2c3e50',
        metalness: 0.1,
        roughness: 0.3,
        clearcoat: 0.8,           // 清漆强度
        clearcoatRoughness: 0.1, // 清漆粗糙度
        envMapIntensity: 1.2
    }
});

// 玻璃金属混合材质
await visualizer.updateModel('model', {
    material: {
        color: '#34495e',
        metalness: 0.6,          // 60%金属
        roughness: 0.2,
        transmission: 0.4,      // 40%透射
        transparent: true,
        opacity: 0.7,
        thickness: 0.5,         // 厚度
        ior: 1.5                // 折射率
    }
});
```

### 4. 性能优化集成

```typescript
// 监听材质编辑器的性能变化
editor.on('performanceUpdate', (stats) => {
    // 根据性能动态调整后处理
    if (stats.fps < 30) {
        visualizer.updatePostProcessing({
            ssao: { enabled: false },
            bloom: { enabled: false }
        });
    } else {
        visualizer.updatePostProcessing({
            ssao: { enabled: true, intensity: 0.5 },
            bloom: { enabled: true, strength: 0.3 }
        });
    }
});

// 材质缓存优化
const materialCache = visualizer.materialSystem.getCache();
editor.setMaterialCache(materialCache);
```

### 5. 导出导入集成

```typescript
// 从材质编辑器导出配置
const materialConfig = editor.exportMaterial();

// 导入到核心系统
await visualizer.updateModel('model', {
    material: materialConfig
});

// 保存材质预设到核心系统
const customPreset = {
    name: '用户自定义',
    params: editor.getCurrentMaterial()
};
visualizer.materialSystem.addPreset(customPreset);
```

## 配置验证和调试

1. **光照配置验证**

   ```typescript
   // 获取所有灯光信息
   const lightsInfo = visualizer.lightSystem.getAllLightsInfo();
   lightsInfo.forEach(light => {
     console.log(`${light.id}: ${light.type}, 强度: ${light.intensity}`);
   });
   ```

2. **材质配置验证**

   ```typescript
   // 获取材质配置
   const materialConfig = visualizer.materialSystem.getMaterialConfig('materialId');
   console.log('材质配置:', materialConfig);

   // 检查材质使用统计
   const stats = visualizer.materialSystem.getMaterialStats();
   console.log('内存使用:', stats.memoryUsage, 'MB');
   ```

3. **性能监控**
   ```typescript
   // 监听配置变更的性能影响
   visualizer.on('performance', (stats) => {
     if (stats.fps < 30) {
       console.warn('性能警告: FPS低于30');
       // 可以自动降低质量设置
     }
   });
   ```

这些配置技术和材质编辑器功能可以根据不同的材质类型和光照需求进行组合，创造出丰富多样的视觉效果。
