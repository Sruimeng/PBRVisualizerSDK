# PBR材质优化和缓存策略

## 1. 性能优化基础

### 材质系统性能监控

1. **实时性能统计**
   ```typescript
   // 获取材质系统统计信息
   function getMaterialPerformanceStats() {
     const stats = materialSystem.getMaterialStats();
     return {
       materialCount: stats.cachedMaterials,
       textureCount: stats.cachedTextures,
       memoryUsageMB: stats.memoryUsage.toFixed(2),
       avgTextureSize: calculateAverageTextureSize(stats)
     };
   }

   // 监控性能变化
   setInterval(() => {
     const stats = getMaterialPerformanceStats();
     console.log('材质性能:', stats);
   }, 3000);
   ```

2. **性能阈值监控**
   ```typescript
   function monitorPerformance() {
     const stats = materialSystem.getMaterialStats();

     // 内存警告阈值
     if (stats.memoryUsage > 200) { // MB
       console.warn('内存使用超过200MB，建议清理资源');
       materialSystem.cleanup();
     }

     // 纹理数量警告
     if (stats.cachedTextures > 100) {
       console.warn('纹理缓存过多，建议优化纹理数量');
     }
   }
   ```

### GPU优化策略

1. **各向异性过滤设置**
   ```typescript
   // 材质系统自动应用最优各向异性级别
   function optimizeAnisotropy(material: THREE.Material) {
     const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

     // 为所有纹理设置各向异性
     [material.map, material.normalMap, material.roughnessMap, material.metalnessMap].forEach(texture => {
       if (texture) {
         texture.anisotropy = maxAnisotropy;
       }
     });
   }
   ```

2. **纹理分辨率优化**
   ```typescript
   // 根据设备性能调整纹理分辨率
   function optimizeTextureResolution(config: QualityConfig) {
     const isMobile = config.mobileOptimized;
     const maxResolution = isMobile ? 1024 : 2048;

     // 设置纹理最大尺寸
     THREE.Texture.DEFAULT_IMAGE_SIZE = maxResolution;

     // 压缩纹理
     if (isMobile) {
       THREE.Texture.DEFAULT_ANISOTROPY = 4;
     }
   }
   ```

## 2. 多级缓存系统

### 材质缓存策略

1. **缓存键生成算法**
   ```typescript
   // 高效的材质缓存键生成
   function generateMaterialCacheKey(config: MaterialState): string {
     const keyComponents = [
       typeof config.color === 'string' ? config.color : config.color.getHexString(),
       config.roughness.toFixed(3),
       config.metalness.toFixed(3),
       (config.emissiveIntensity || 0).toFixed(3),
       (config.envMapIntensity || 1).toFixed(3),
       config.normalMap || '',
       config.aoMap || '',
       config.emissiveMap || '',
       config.metallicRoughnessMap || ''
     ];

     return keyComponents.join('|');
   }

   // 带优先级的缓存策略
   class PriorityCache {
     private cache = new Map<string, { material: THREE.Material; priority: number; lastUsed: number }>();

     get(key: string): THREE.Material | null {
       const item = this.cache.get(key);
       if (item) {
         item.lastUsed = Date.now();
         return item.material;
       }
       return null;
     }
   }
   ```

2. **纹理缓存优化**
   ```typescript
   // 智能纹理缓存系统
   class TextureCache {
     private cache = new Map<string, THREE.Texture>();
     private usage = new Map<string, number>();

     get(url: string): THREE.Texture {
       if (this.cache.has(url)) {
         this.usage.set(url, (this.usage.get(url) || 0) + 1);
         return this.cache.get(url)!;
       }

       const texture = this.loadTexture(url);
       this.cache.set(url, texture);
       this.usage.set(url, 1);
       return texture;
     }

     // LRU清理策略
     cleanup(maxSize: number = 100): void {
       if (this.cache.size <= maxSize) return;

       // 按使用频率排序
       const sortedEntries = Array.from(this.usage.entries())
         .sort((a, b) => a[1] - b[1])
         .slice(0, this.cache.size - maxSize);

       sortedEntries.forEach(([url]) => {
         const texture = this.cache.get(url);
         if (texture) texture.dispose();
         this.cache.delete(url);
         this.usage.delete(url);
       });
     }
   }
   ```

### 缓存预热策略

1. **常用材质预热**
   ```typescript
   // 预加载常用材质预设
   async function preloadCommonMaterials() {
     const commonPresets = ['metal', 'plastic', 'wood', 'glass'];

     for (const preset of commonPresets) {
       const config = materialSystem.createPresetMaterial(preset as any);
       materialSystem.createMaterial(`preload_${preset}`, config);
     }

     console.log('常用材质预加载完成');
   }
   ```

2. **纹理预加载**
   ```typescript
   // 批量纹理预加载
   class TexturePreloader {
     private loadedTextures = new Set<string>();

     async preloadTextures(urls: string[]): Promise<void> {
       const promises = urls.map(url => this.loadTexture(url));
       await Promise.all(promises);
     }

     private async loadTexture(url: string): Promise<void> {
       if (this.loadedTextures.has(url)) return;

       return new Promise((resolve, reject) => {
         const loader = new THREE.TextureLoader();
         loader.load(url, () => {
           this.loadedTextures.add(url);
           resolve();
         }, undefined, reject);
       });
     }
   }
   ```

## 3. 内存管理优化

### 资源生命周期管理

1. **智能资源清理**
   ```typescript
   // 自动资源清理系统
   class ResourceManager {
     private materials = new Set<THREE.Material>();
     private textures = new Set<THREE.Texture>();

     addMaterial(material: THREE.Material): void {
       this.materials.add(material);
     }

     addTexture(texture: THREE.Texture): void {
       this.textures.add(texture);
     }

     // 基于LRU的清理策略
     cleanup(maxAge: number = 300000): void { // 5分钟
       const now = Date.now();

       // 清理材质
       this.materials.forEach(material => {
         if (material.userData.lastUsed && now - material.userData.lastUsed > maxAge) {
           material.dispose();
           this.materials.delete(material);
         }
       });

       // 清理纹理
       this.textures.forEach(texture => {
         if (texture.userData.lastUsed && now - texture.userData.lastUsed > maxAge) {
           texture.dispose();
           this.textures.delete(texture);
         }
       });
     }
   }
   ```

2. **材质实例池**
   ```typescript
   // 材质实例池管理
   class MaterialPool {
     private pool = new Map<string, THREE.Material[]>();
     private maxPoolSize = 10;

     getMaterial(key: string): THREE.Material {
       const materials = this.pool.get(key);
       if (materials && materials.length > 0) {
         return materials.pop()!;
       }
       return null;
     }

     returnMaterial(key: string, material: THREE.Material): void {
       if (!this.pool.has(key)) {
         this.pool.set(key, []);
       }

       const materials = this.pool.get(key)!;
       if (materials.length < this.maxPoolSize) {
         materials.push(material);
       } else {
         material.dispose();
       }
     }
   }
   ```

### 内存使用监控

1. **实时内存统计**
   ```typescript
   // 扩展内存监控功能
   function getDetailedMemoryStats() {
     const stats = materialSystem.getMaterialStats();

     // 计算详细内存使用
     let totalTextureMemory = 0;
     let materialOverhead = 0;

     materialSystem.getTextureCache().forEach(texture => {
       if ((texture as any).image) {
         const size = (texture as any).image.width * (texture as any).image.height * 4;
         totalTextureMemory += size;
       }
     });

     return {
       cachedMaterials: stats.cachedMaterials,
       cachedTextures: stats.cachedTextures,
       textureMemoryMB: (totalTextureMemory / 1024 / 1024).toFixed(2),
       materialOverheadMB: (materialOverhead / 1024 / 1024).toFixed(2),
       totalMemoryMB: stats.memoryUsage.toFixed(2)
     };
   }
   ```

2. **内存泄漏检测**
   ```typescript
   // 内存泄漏检测
   class MemoryLeakDetector {
     private snapshots = new Map<string, any>();

     takeSnapshot(id: string): void {
       this.snapshots.set(id, getDetailedMemoryStats());
     }

     checkLeaks(): void {
       const current = getDetailedMemoryStats();
       this.snapshots.forEach((snapshot, id) => {
         const growth = current.textureMemoryMB - snapshot.textureMemoryMB;
         if (growth > 50) { // 增长超过50MB
           console.warn(`检测到内存泄漏: ${id}, 增长${growth.toFixed(2)}MB`);
         }
       });
     }
   }
   ```

## 4. 渲染性能优化

### 材质批处理优化

1. **相同材质合并**
   ```typescript
   // 材质批处理优化
   class MaterialBatcher {
     private materialGroups = new Map<string, THREE.Mesh[]>();

     addMesh(mesh: THREE.Mesh): void {
       const material = mesh.material as THREE.Material;
       const materialKey = material.uuid;

       if (!this.materialGroups.has(materialKey)) {
         this.materialGroups.set(materialKey, []);
       }

       this.materialGroups.get(materialKey)!.push(mesh);
     }

     applyOptimizations(): void {
       this.materialGroups.forEach((meshes, materialKey) => {
         if (meshes.length > 1) {
           // 合并几何体以减少DrawCall
           const mergedGeometry = new THREE.BufferGeometry();
           meshes.forEach(mesh => {
             mergedGeometry.merge(mesh.geometry);
           });

           // 创建单个网格
           const mergedMesh = new THREE.Mesh(mergedGeometry, meshes[0].material);
           // ... 替换原始网格
         }
       });
     }
   }
   ```

2. **LOD材质系统**
   ```typescript
   // 基于距离的材质LOD系统
   class MaterialLODSystem {
     private lodLevels = new Map<string, { [distance: number]: MaterialState }>();

     getLODMaterial(baseMaterial: string, distance: number): MaterialState {
       const levels = this.lodLevels.get(baseMaterial);
       if (!levels) return null;

       // 找到合适的LOD级别
       let selectedLevel = null;
       for (const [dist, material] of Object.entries(levels).sort()) {
         if (distance <= parseFloat(dist)) {
           selectedLevel = material;
           break;
         }
       }

       return selectedLevel || levels[Object.keys(levels).pop()];
     }

     // 为不同距离创建简化材质
     createLODLevels(baseConfig: MaterialState): { [distance: number]: MaterialState } {
       return {
         '10': { ...baseConfig, roughness: 0.8 },      // 近距离：高细节
         '50': { ...baseConfig, roughness: 0.6 },      // 中距离：中等细节
         '100': { ...baseConfig, roughness: 0.4 }      // 远距离：低细节
       };
     }
   }
   ```

### GPU内存优化

1. **纹理压缩**
   ```typescript
   // 纹理压缩优化
   class TextureCompressor {
     async compressTexture(texture: THREE.Texture, quality: number = 0.8): Promise<THREE.Texture> {
       // 创建压缩纹理
       const compressed = new THREE.DataTexture(
         new Uint8Array(texture.image.data.buffer),
         texture.image.width,
         texture.image.height,
         texture.format,
         texture.type
       );

       // 应用压缩设置
       compressed.minFilter = THREE.LinearMipmapLinearFilter;
       compressed.magFilter = THREE.LinearFilter;
       compressed.generateMipmaps = true;

       return compressed;
     }
   }
   ```

2. **材质实例共享**
   ```typescript
   // 材质实例共享优化
   class MaterialSharing {
     private sharedMaterials = new Map<string, THREE.Material>();

     shareMaterial(config: MaterialState): THREE.Material {
       const key = this.generateKey(config);

       if (!this.sharedMaterials.has(key)) {
         const material = new THREE.MeshStandardMaterial(config);
         this.sharedMaterials.set(key, material);
       }

       return this.sharedMaterials.get(key);
     }

     // 优化相同材质的使用
     optimizeMaterialUsage(scene: THREE.Scene): void {
       const materialUsage = new Map<THREE.Material, number>();

       // 统计材质使用次数
       scene.traverse((object) => {
         if (object instanceof THREE.Mesh && object.material) {
           const material = Array.isArray(object.material) ? object.material[0] : object.material;
           materialUsage.set(material, (materialUsage.get(material) || 0) + 1);
         }
       });

       // 识别可共享的材质
       materialUsage.forEach((count, material) => {
         if (count > 1) {
           console.log(`材质 ${material.uuid} 被使用 ${count} 次，可以共享`);
         }
       });
     }
   }
   ```

## 5. 高级优化技术

### 异步材质更新

1. **非阻塞材质更新**
   ```typescript
   // 异步材质更新系统
   class AsyncMaterialUpdater {
     private updateQueue: Array<{ material: THREE.Material; updates: Partial<MaterialState> }> = [];
     private isProcessing = false;

     queueUpdate(material: THREE.Material, updates: Partial<MaterialState>): void {
       this.updateQueue.push({ material, updates });

       if (!this.isProcessing) {
         this.processQueue();
       }
     }

     private async processQueue(): Promise<void> {
       this.isProcessing = true;

       while (this.updateQueue.length > 0) {
         const { material, updates } = this.updateQueue.shift()!;

         // 分批应用更新以避免卡顿
         await this.applyUpdatesInBatches(material, updates);
       }

       this.isProcessing = false;
     }

     private async applyUpdatesInBatches(material: THREE.Material, updates: Partial<MaterialState>): Promise<void> {
       const batchSize = 5;
       const updateKeys = Object.keys(updates);

       for (let i = 0; i < updateKeys.length; i += batchSize) {
         const batch = updateKeys.slice(i, i + batchSize);

         batch.forEach(key => {
           const value = updates[key as keyof MaterialState];
           if (key in material) {
             (material as any)[key] = value;
           }
         });

         material.needsUpdate = true;
         await new Promise(resolve => setTimeout(resolve, 0)); // 让出主线程
       }
     }
   }
   ```

2. **材质预热和预编译**
   ```typescript
   // 着色器预编译
   class ShaderPrecompiler {
     private compiledShaders = new Map<string, THREE.ShaderMaterial>();

     async precompileShaders(): Promise<void> {
       const commonShaders = [
         this.createStandardShader(),
         this.createPhysicalShader(),
         this.createEmissiveShader()
       ];

       await Promise.all(commonShaders.map(shader => this.compileShader(shader)));
     }

     private async compileShader(shader: THREE.ShaderMaterial): Promise<void> {
       return new Promise((resolve) => {
         // 强制编译着色器
         shader.needsUpdate = true;
         setTimeout(resolve, 100); // 等待编译完成
       });
     }
   }
   ```

### 性能分析工具

1. **性能分析器**
   ```typescript
   // 材质性能分析器
   class MaterialProfiler {
     private profiles = new Map<string, { time: number; count: number }>();

     profileMaterialOperation(name: string, operation: () => void): void {
       const start = performance.now();
       operation();
       const end = performance.now();

       const profile = this.profiles.get(name) || { time: 0, count: 0 };
       profile.time += (end - start);
       profile.count++;

       this.profiles.set(name, profile);
     }

     getPerformanceReport(): string {
       let report = '材质性能分析报告:\n';

       this.profiles.forEach((profile, name) => {
         const avgTime = (profile.time / profile.count).toFixed(3);
         report += `${name}: 平均耗时 ${avgTime}ms (调用${profile.count}次)\n`;
       });

       return report;
     }
   }
   ```

2. **实时性能监控**
   ```typescript
   // 实时性能监控面板
   class PerformanceMonitor {
     private stats = {
       materialUpdates: 0,
       textureLoads: 0,
       cacheHits: 0,
       cacheMisses: 0
     };

     updateMaterial(): void {
       this.stats.materialUpdates++;
     }

     loadTexture(): void {
       this.stats.textureLoads++;
     }

     cacheHit(): void {
       this.stats.cacheHits++;
     }

     cacheMiss(): void {
       this.stats.cacheMisses++;
     }

     getEfficiencyReport(): string {
       const totalCacheOps = this.stats.cacheHits + this.stats.cacheMisses;
       const hitRate = totalCacheOps > 0 ?
         ((this.stats.cacheHits / totalCacheOps) * 100).toFixed(1) : '0';

       return `缓存命中率: ${hitRate}%\n` +
              `材质更新: ${this.stats.materialUpdates}\n` +
              `纹理加载: ${this.stats.textureLoads}`;
     }
   }
   ```

## 6. 最佳实践和注意事项

### 缓存优化建议

1. **缓存键设计**
   - 使用有意义的缓存键格式，便于调试
   - 考虑材质参数的精度，避免因微小差异导致缓存失效
   - 定期清理不再使用的缓存项

2. **内存管理**
   - 及时释放不再使用的材质和纹理
   - 监控内存使用，及时清理过期资源
   - 避免循环引用导致的内存泄漏

### 渲染性能建议

1. **材质批处理**
   - 尽可能合并相同材质的网格
   - 使用实例化渲染减少DrawCall
   - 合理使用LOD系统优化远距离渲染

2. **纹理优化**
   - 使用适当分辨率的纹理
   - 启用纹理压缩减少内存占用
   - 合理使用mipmap提升采样性能

### 调试和监控

1. **性能监控**
   - 实时监控内存使用和缓存效率
   - 记录性能指标，分析性能瓶颈
   - 建立性能基线，及时发现异常

2. **调试工具**
   - 提供材质状态查询接口
   - 支持性能分析报告生成
   - 实现缓存命中率统计

通过这些优化策略和技术，可以显著提升PBR材质系统的性能，减少内存使用，提高渲染效率，为用户提供流畅的可视化体验。