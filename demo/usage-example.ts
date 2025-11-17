import { PBRVisualizer } from '../src';

// 示例：基本用法
const visualizer = new PBRVisualizer({
  container: document.getElementById('viewer')!,
  models: [
    {
      id: 'car_body',
      source: '/models/car_body.gltf',
      initialState: {
        materials: {
          paint: {
            color: '#ff0000',
            roughness: 0.2,
            metalness: 0.9
          }
        }
      }
    },
    {
      id: 'wheels',
      source: '/models/wheels.gltf'
    }
  ],
  initialGlobalState: {
    environment: {
      type: 'noise-sphere',
      sphere: { radius: 0.8, pulse: true }
    }
  },
  quality: {
    resolution: 1.0,
    maxSamples: 16,
    mobileOptimized: false
  },
  debug: true
});

// 监听事件
visualizer.on('stateChange', (event) => {
  console.log('State changed:', event.stateId, event.updatedModels);
});

visualizer.on('modelLoaded', (event) => {
  console.log(`Model ${event.modelId} loaded with ${event.triangleCount} triangles`);
});

visualizer.on('performanceUpdate', (stats) => {
  console.log(`FPS: ${stats.fps}, Memory: ${stats.memoryUsage}MB`);
});

// 更新模型
async function updateCarColor(color: string) {
  await visualizer.updateModel('car_body', {
    materials: {
      paint: { color, roughness: 0.2, metalness: 0.9 }
    }
  }, { duration: 800 });
}

// 批量更新
async function updateMultipleModels() {
  await visualizer.batchUpdate([
    { 
      modelId: 'car_body', 
      state: { 
        materials: { paint: { color: '#0000ff' } } 
      } 
    },
    { 
      modelId: 'wheels', 
      state: { 
        materials: { rim: { roughness: 0.1 } } 
      } 
    }
  ], { duration: 500, description: 'color_change' });
}

// 相机控制
visualizer.setCamera([5, 3, 8], [0, 1, 0]);

// 环境更新
visualizer.updateEnvironment({
  type: 'noise-sphere',
  sphere: { radius: 1.2, pulse: true, frequency: 2.0 }
});

// 状态管理
visualizer.undo();
visualizer.redo();

// 分享状态
async function shareConfiguration() {
  const shareUrl = await visualizer.shareState();
  console.log('Share URL:', shareUrl);
  return shareUrl;
}

// 截图
function captureScreenshot() {
  const dataUrl = visualizer.captureFrame();
  const link = document.createElement('a');
  link.download = 'pbr-visualization.png';
  link.href = dataUrl;
  link.click();
}

// 性能统计
function getPerformanceStats() {
  const stats = visualizer.getPerformanceStats();
  return {
    fps: stats.fps,
    frameTime: stats.frameTime,
    drawCalls: stats.drawCalls,
    triangles: stats.triangles,
    memoryUsage: stats.memoryUsage
  };
}

// 清理
function dispose() {
  visualizer.dispose();
}

export {
  updateCarColor,
  updateMultipleModels,
  shareConfiguration,
  captureScreenshot,
  getPerformanceStats,
  dispose
};