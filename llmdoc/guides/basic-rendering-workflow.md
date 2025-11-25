# 基本渲染工作流程

## 创建和配置3D场景

1. **初始化PBRVisualizer**
   ```typescript
   // 创建可视化器实例
   const visualizer = new PBRVisualizer({
     initialGlobalState: {
       environment: {
         url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr',
         intensity: 1.0
       }
     }
   });

   // 初始化渲染系统
   await visualizer.initialize();
   ```

2. **加载3D模型**
   ```typescript
   // 加载GLTF模型
   await visualizer.loadModel('product1', '/models/product.glb', {
     material: visualizer.materialSystem.createPresetMaterial('metal')
   });

   // 支持的文件格式: GLTF, GLB, DRACO压缩
   ```

3. **配置环境光照**
   ```typescript
   // 设置HDR环境
   await visualizer.environmentSystem.setEnvironment({
     url: 'https://example.com/environment.hdr',
     intensity: 1.2
   });

   // 或使用程序化环境
   visualizer.environmentSystem.createProceduralEnvironment('studio');
   ```

4. **设置Studio布光**
   ```typescript
   // 自动创建三点布光
   visualizer.lightSystem.createStudioLighting({
     center: modelCenter,
     size: modelSize,
     radius: Math.max(size.x, size.y, size.z) / 2
   });

   // 手动调整灯光参数
   visualizer.lightSystem.updateStudioIntensity(1.1);
   ```

5. **配置材质属性**
   ```typescript
   // 更新材质参数
   await visualizer.updateModel('product1', {
     material: {
       color: '#ffffff',
       roughness: 0.3,
       metalness: 0.8,
       envMapIntensity: 1.2
     }
   });

   // 使用预设材质
   const plasticConfig = visualizer.materialSystem.createPresetMaterial('plastic');
   ```

6. **调整后处理效果**
   ```typescript
   // 配置SSAO接触阴影
   visualizer.postProcessSystem.setConfig({
     ssao: {
       enabled: true,
       kernelRadius: 4,
       minDistance: 0.005,
       maxDistance: 0.1
     },
     bloom: {
       enabled: false, // 性能考虑
       strength: 0.5
     }
   });
   ```

7. **相机和控制器配置**
   ```typescript
   // 设置相机位置
   visualizer.camera.position.set(3, 2, 5);
   visualizer.camera.lookAt(0, 0, 0);

   // 配置轨道控制器
   visualizer.controls.enableDamping = true;
   visualizer.controls.dampingFactor = 0.05;
   ```

8. **实时性能监控**
   ```typescript
   // 监听性能事件
   visualizer.on('performance', (stats) => {
     console.log(`FPS: ${stats.fps}, DrawCalls: ${stats.drawCalls}`);
   });

   // 获取当前性能统计
   const stats = visualizer.getPerformanceStats();
   ```

9. **截图导出**
   ```typescript
   // 截取当前帧
   const imageData = visualizer.captureFrame('png', 0.9);

   // 保存为图片
   const link = document.createElement('a');
   link.href = imageData;
   link.download = 'render.png';
   link.click();
   ```

10. **状态管理操作**
    ```typescript
    // 批量更新多个模型
    await visualizer.batchUpdate([
      {
        modelId: 'product1',
        state: { material: { color: '#ff0000' } }
      },
      {
        modelId: 'product2',
        state: { visible: false }
      }
    ]);

    // 撤销/重做操作
    await visualizer.undo();    // 撤销上一步操作
    await visualizer.redo();    // 重做撤销的操作
    ```

## 工作流程验证

1. **检查渲染状态**
   ```typescript
   if (visualizer.initialized) {
     console.log('渲染系统已就绪');
   }
   ```

2. **监控模型加载**
   ```typescript
   visualizer.on('modelLoaded', (data) => {
     console.log(`模型加载完成: ${data.modelId}, 耗时: ${data.loadTime}ms`);
   });
   ```

3. **错误处理**
   ```typescript
   visualizer.on('error', (errorEvent) => {
     console.error('渲染错误:', errorEvent.message);
     // 根据错误类型进行恢复
   });
   ```

这个工作流程涵盖了从初始化到最终输出的完整3D渲染过程，适合大多数产品可视化和材质预览场景。