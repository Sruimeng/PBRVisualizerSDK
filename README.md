# PBR Visualizer SDK

专业级多模型状态管理3D渲染架构 - PBR可视化器SDK

## 特性

- **分层状态管理**: 支持全局状态和模型级状态的独立管理
- **物理精确渲染**: 基于Three.js的PBR渲染管线，支持PMREM环境映射
- **动态环境系统**: 程序化生成的环境贴图，支持多种环境类型
- **事务操作**: 完整的撤销/重做功能，支持批量状态更新
- **自适应质量**: 根据设备性能自动调整渲染质量
- **实时性能监控**: 内置性能统计和内存使用监控
- **分享功能**: 支持状态分享和截图导出

## 快速开始

### 安装

```bash
npm install pbr-visualizer-sdk
```

### 基本使用

```javascript
import { PBRVisualizer } from 'pbr-visualizer-sdk';

// 创建可视化器实例
const visualizer = new PBRVisualizer({
    container: document.getElementById('viewer'),
    models: [
        {
            id: 'model_1',
            source: 'path/to/model.gltf',
            initialState: {
                materials: {
                    default: {
                        color: '#ff0000',
                        roughness: 0.2,
                        metalness: 0.9
                    }
                }
            }
        }
    ],
    initialGlobalState: {
        environment: {
            type: 'noise-sphere',
            sphere: { radius: 0.8, pulse: true }
        },
        camera: {
            position: [3, 2, 5],
            target: [0, 0, 0],
            fov: 45
        }
    }
});

// 更新模型材质
await visualizer.updateModel('model_1', {
    materials: {
        default: {
            color: '#00ff00',
            roughness: 0.5,
            metalness: 0.8
        }
    }
});

// 撤销操作
await visualizer.undo();

// 截图
const dataUrl = visualizer.captureFrame();
```

## API 文档

### PBRVisualizer

#### 构造函数

```typescript
new PBRVisualizer(options: VisualizerOptions)
```

#### 方法

- `updateModel(modelId: string, state: Partial<ModelState>, options?: UpdateOptions): Promise<void>`
- `batchUpdate(updates: BatchUpdate[]): Promise<void>`
- `setCamera(position: Vector3, target: Vector3): Promise<void>`
- `updateEnvironment(config: EnvironmentConfig): Promise<void>`
- `undo(): Promise<void>`
- `redo(): Promise<void>`
- `shareState(): Promise<string>`
- `captureFrame(): string`
- `setQuality(config: QualityConfig): Promise<void>`

#### 事件

- `modelLoaded`: 模型加载完成
- `performanceUpdate`: 性能统计更新
- `error`: 错误事件

## 演示

查看交互式演示：
- [PBR可视化器演示](http://localhost:8083/demo/pbr-demo.html)
- [完整功能演示](http://localhost:8083/demo/index.html)

## 开发

```bash
# 安装依赖
pnpm install

# 开发服务器
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

## 许可证

MIT
