# PBR材质创建工作流程

## 1. 材质创建基础

### 创建基础PBR材质

1. **初始化材质系统**

   ```typescript
   // 创建材质系统实例
   const materialSystem = new MaterialSystem(renderer);

   // 获取材质统计信息
   const stats = materialSystem.getMaterialStats();
   console.log(`当前缓存: ${stats.cachedMaterials}材质, ${stats.cachedTextures}纹理`);
   ```

2. **创建自定义材质**

   ```typescript
   // 基础金属材质
   const metalMaterial = materialSystem.createMaterial('metal_material', {
     color: '#888888',
     roughness: 0.1,
     metalness: 1.0,
     envMapIntensity: 1.2
   });

   // 塑料材质
   const plasticMaterial = materialSystem.createMaterial('plastic_material', {
     color: '#ffffff',
     roughness: 0.3,
     metalness: 0.0,
     envMapIntensity: 0.8
   });
   ```

### 使用材质预设

1. **应用内置预设**

   ```typescript
   // 获取预设材质配置
   const presets = ['metal', 'plastic', 'wood', 'glass', 'fabric'];

   presets.forEach(type => {
     const presetConfig = materialSystem.createPresetMaterial(type as any);
     const material = materialSystem.createMaterial(`${type}_preset`, presetConfig);
     console.log(`${type}预设材质:`, presetConfig);
   });
   ```

2. **创建材质变体**

   ```typescript
   // 基础配置
   const baseConfig = {
     color: '#ff0000',
     roughness: 0.5,
     metalness: 0.3
   };

   // 生成变体
   const variants = materialSystem.createMaterialVariants(baseConfig);

   // 使用不同变体
   await visualizer.updateModel('product1', {
     material: variants.smooth  // 光滑变体
   });

   await visualizer.updateModel('product2', {
     material: variants.metallic // 金属变体
   });
   ```

## 2. 高级材质配置

### 纹理映射配置

1. **法线贴图材质**

   ```typescript
   const normalMappedMaterial = materialSystem.createMaterial('normal_material', {
     color: '#cccccc',
     roughness: 0.4,
     metalness: 0.2,
     normalMap: '/textures/normal.jpg',
     normalScale: 1.5  // 增强法线效果
   });
   ```

2. **完整纹理材质**

   ```typescript
   const texturedMaterial = materialSystem.createMaterial('textured_material', {
     color: '#ffffff',
     roughness: 0.8,
     metalness: 0.0,
     normalMap: '/textures/normal.jpg',
     aoMap: '/textures/ao.jpg',
     emissiveMap: '/textures/emissive.jpg',
     metallicRoughnessMap: '/textures/metallic_roughness.jpg',
     aoMapIntensity: 1.0,
     envMapIntensity: 1.0
   });

   // 扩展纹理材质（新增支持）
   const extendedTexturedMaterial = materialSystem.createMaterial('extended_textured', {
     color: '#ffffff',
     roughness: 0.6,
     metalness: 0.3,
     normalMap: '/textures/normal.jpg',
     aoMap: '/textures/ao.jpg',
     emissiveMap: '/textures/emissive.jpg',
     metallicRoughnessMap: '/textures/mr.jpg',
     transmission: 0.2,      // 透射材质
     transparent: true,      // 透明支持
     opacity: 0.8,           // 透明度
     envMapIntensity: 1.0
   });
   ```

### 特殊材质类型

1. **玻璃材质**（已增强支持）

   ```typescript
   const glassMaterial = materialSystem.createMaterial('glass_material', {
     color: '#ffffff',
     roughness: 0.0,
     metalness: 0.0,
     transmission: 1.0,      // 完全透射
     transparent: true,      // 启用透明
     opacity: 0.9,           // 透明度
     envMapIntensity: 1.0
   });

   // 半透明玻璃材质
   const translucentGlass = materialSystem.createMaterial('translucent_glass', {
     color: '#ffffff',
     roughness: 0.0,
     metalness: 0.0,
     transmission: 0.8,      // 部分透射
     transparent: true,
     opacity: 0.6,
     envMapIntensity: 1.2
   });
   ```

2. **发光材质**（已支持发光贴图）

   ```typescript
   const emissiveMaterial = materialSystem.createMaterial('emissive_material', {
     color: '#444444',
     roughness: 0.8,
     metalness: 0.0,
     emissive: '#00ff00',
     emissiveIntensity: 2.0,
     emissiveMap: '/textures/emissive_pattern.jpg'
   });

   // 混合发光材质
   const mixedEmissive = materialSystem.createMaterial('mixed_emissive', {
     color: '#ffffff',
     roughness: 0.5,
     metalness: 0.2,
     emissive: '#ff0000',
     emissiveIntensity: 1.5,
     emissiveMap: '/textures/emissive.jpg',
     transmission: 0.3,
     transparent: true,
     opacity: 0.9
   });
   ```

## 3. 动态材质更新

### 实时参数调整

1. **单个材质更新**

   ```typescript
   // 更新材质粗糙度
   materialSystem.updateMaterial('metal_material', {
     roughness: 0.05,  // 更光滑
     metalness: 1.0    // 完全金属
   });

   // 更新环境反射强度
   materialSystem.updateMaterial('material_id', {
     envMapIntensity: 1.5
   });
   ```

2. **批量材质更新**

   ```typescript
   // 批量更新多个材质参数
   const updates = {
     roughness: 0.2,
     metalness: 0.8,
     color: '#ffaa00'
   };

   // 应用到场景中的所有对象
   visualizer.scene.traverse((object) => {
     if (object instanceof THREE.Mesh) {
       materialSystem.applyMaterialUpdates(object, 'material_id');
     }
   });
   ```

### 材质状态管理

1. **获取材质配置**

   ```typescript
   // 获取当前材质配置
   const config = materialSystem.getMaterialConfig('material_id');
   if (config) {
     console.log('当前材质:', config);
   }

   // 获取默认材质
   const defaultMaterial = materialSystem.getDefaultMaterial();
   console.log('默认材质:', defaultMaterial);
   ```

2. **材质配置验证**
   ```typescript
   // 验证材质参数范围
   function validateMaterialConfig(config: MaterialState): boolean {
     return config.roughness >= 0 && config.roughness <= 1 &&
            config.metalness >= 0 && config.metalness <= 1 &&
            config.envMapIntensity >= 0;
   }
   ```

## 4. 性能优化工作流

### 材质优化

1. **模型材质优化**

   ```typescript
   // 自动优化模型材质
   materialSystem.optimizeModelAssets(modelObject, environmentTexture);

   // 优化后的材质特性：
   // - 启用各向异性过滤
   // - 优化环境反射
   // - 计算法线信息
   // - 禁用实时阴影（使用后处理）
   ```

2. **纹理优化**

   ```typescript
   // 获取材质统计信息
   const stats = materialSystem.getMaterialStats();
   console.log(`内存使用: ${stats.memoryUsage.toFixed(2)}MB`);

   // 清理未使用资源
   materialSystem.cleanup();
   ```

### 缓存管理

1. **缓存监控**

   ```typescript
   // 监控缓存状态
   setInterval(() => {
     const stats = materialSystem.getMaterialStats();
     console.log(`缓存: 材质=${stats.cachedMaterials}, 纹理=${stats.cachedTextures}`);
   }, 5000);
   ```

2. **手动清理**

   ```typescript
   // 清理特定材质
   const materialKey = generateCacheKey(config);
   if (materialSystem.hasMaterial(materialKey)) {
     materialSystem.removeMaterial(materialKey);
   }

   // 完全清理
   materialSystem.dispose();
   ```

## 5. 材质配置最佳实践

### 材质参数规范

1. **金属材质**

   ```typescript
   const metalConfig = {
     color: '#888888',     // 中性灰色
     roughness: 0.1,      // 低粗糙度
     metalness: 1.0,      // 完全金属
     envMapIntensity: 1.2 // 增强反射
   };
   ```

2. **塑料材质**

   ```typescript
   const plasticConfig = {
     color: '#ffffff',     // 纯白色
     roughness: 0.3,      // 中等粗糙度
     metalness: 0.0,      // 无金属度
     envMapIntensity: 0.8 // 适度反射
   };
   ```

3. **木材材质**
   ```typescript
   const woodConfig = {
     color: '#8b4513',    // 棕色调
     roughness: 0.8,      // 高粗糙度
     metalness: 0.0,      // 无金属度
     envMapIntensity: 0.5 // 低反射
   };
   ```

### 纹理配置建议

1. **法线贴图**

   - 分辨率: 建议512x512到2048x2048
   - 格式: 支持8位或16位法线贴图
   - 缩放: normalScale建议0.5-2.0

2. **AO贴图**

   - 分辨率: 建议512x512到1024x1024
   - 强度: aoMapIntensity建议0.5-1.5
   - 用途: 增强接触阴影效果

3. **金属粗糙度贴图**
   - 通道: R通道表示金属度，G通道表示粗糙度
   - 分辨率: 建议与基础颜色贴图一致
   - 格式: 建议使用8位或16位纹理

## 6. 调试和故障排除

### 材质调试

1. **材质信息查看**

   ```typescript
   // 查看材质详细信息
   function debugMaterial(materialId: string) {
     const config = materialSystem.getMaterialConfig(materialId);
     const stats = materialSystem.getMaterialStats();

     console.log('材质配置:', config);
     console.log('缓存统计:', stats);

     // 检查纹理加载状态
     if (config?.normalMap) {
       console.log('法线贴图:', config.normalMap);
     }
   }
   ```

2. **性能问题排查**

   ```typescript
   // 检查材质性能影响
   function checkMaterialPerformance() {
     const stats = materialSystem.getMaterialStats();

     if (stats.memoryUsage > 100) {
       console.warn('内存使用过高，建议清理纹理');
     }

     if (stats.cachedTextures > 50) {
       console.warn('纹理缓存过多，建议优化纹理数量');
     }
   }
   ```

### 常见问题解决

1. **纹理显示异常**

   - 检查纹理路径是否正确
   - 确认纹理格式支持
   - 验证纹理加载状态

2. **材质颜色错误**

   - 检查color参数格式
   - 确认色彩空间设置
   - 验证环境光照强度

3. **反射效果异常**
   - 检查envMapIntensity参数
   - 确认环境贴图配置
   - 验证材质粗糙度设置

这个工作流程提供了完整的PBR材质创建和管理指南，从基础材质创建到高级优化技术，帮助开发者快速掌握PBR材质系统的使用方法。
