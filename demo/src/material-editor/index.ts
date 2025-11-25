import * as THREE from 'three';
import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import type {
    VisualizerOptions,
    GlobalState,
    EnvironmentConfig,
    PostProcessState,
    MaterialState,
    PerformanceStats,
    QualityConfig
} from '@sruim/pbr-visualizer-sdk';

/**
 * 材质编辑器Demo类
 * 演示PBR Visualizer SDK的材质编辑功能
 */
export class MaterialEditorDemo {
    private container: HTMLElement;
    private visualizer: PBRVisualizer;
    private currentModel: THREE.Object3D | null = null;
    private materialProperties: Map<string, any> = new Map();

    // UI状态
    private uiState = {
        activeTool: 'material',
        expandedGroups: {
            basic: true,
            advanced: false,
            presets: true
        },
        currentMaterial: {
            color: '#ffffff',
            metalness: 0.5,
            roughness: 0.5,
            clearcoat: 0.0,
            clearcoatRoughness: 0.0,
            envMapIntensity: 1.0,
            transmission: 0.0,
            thickness: 0.0,
            ior: 1.5
        }
    };

    // 材质预设配置
    private materialPresets = {
        metal: {
            name: '金属',
            params: {
                metalness: 1.0,
                roughness: 0.2,
                color: '#cccccc',
                envMapIntensity: 1.5
            }
        },
        plastic: {
            name: '塑料',
            params: {
                metalness: 0.0,
                roughness: 0.5,
                color: '#4a90e2',
                envMapIntensity: 0.8
            }
        },
        wood: {
            name: '木材',
            params: {
                metalness: 0.0,
                roughness: 0.8,
                color: '#8b4513',
                envMapIntensity: 0.6
            }
        },
        glass: {
            name: '玻璃',
            params: {
                metalness: 0.0,
                roughness: 0.0,
                color: '#ffffff',
                envMapIntensity: 1.0,
                transmission: 1.0,
                transparent: true,
                opacity: 0.8
            }
        },
        fabric: {
            name: '织物',
            params: {
                metalness: 0.0,
                roughness: 0.9,
                color: '#9b59b6',
                envMapIntensity: 0.4
            }
        },
        ceramic: {
            name: '陶瓷',
            params: {
                metalness: 0.0,
                roughness: 0.1,
                color: '#ffffff',
                envMapIntensity: 1.2
            }
        }
    };

    constructor(container: HTMLElement) {
        this.container = container;
        this.init();
    }

    /**
     * 初始化材质编辑器
     */
    private async init(): Promise<void> {
        try {
            // 准备初始化配置
            const options: VisualizerOptions = {
                container: this.container,
                models: [
                    {
                        source: './glb/Camera_XHS_17479384306051040g00831hpgdts3jo6g5pmo3n0nc99qji23br8.glb',
                        id: 'model1',
                        initialState: {
                            visible: true,
                            transform: {
                                position: new THREE.Vector3(1, 0, 0),
                                rotation: new THREE.Euler(0, 0, 0),
                                scale: new THREE.Vector3(1, 1, 1)
                            }
                        }
                    }
                ],
                initialGlobalState: {
                    environment: {
                        intensity: 1.0,
                        url: ''
                    },
                    sceneSettings: {
                        background: new THREE.Color(0x1a1a1a),
                        exposure: 1.0,
                        gamma: 2.2
                    },
                    postProcessing: {
                        enabled: true,
                        toneMapping: {
                            type: THREE.ACESFilmicToneMapping,
                            exposure: 1.0,
                            whitePoint: 1.0
                        },
                        bloom: {
                            enabled: true,
                            strength: 0.3,
                            radius: 0.4,
                            threshold: 0.8
                        },
                        ssao: {
                            enabled: true,
                            kernelRadius: 4,
                            minDistance: 0.005,
                            maxDistance: 0.1
                        },
                        antialiasing: {
                            enabled: true,
                            type: 'fxaa'
                        }
                    }
                },
                quality: {
                    resolution: 1.0,
                    maxSamples: 16,
                    mobileOptimized: false,
                    textureFormat: 'sRGB8_ALPHA8',
                    maxTextureSize: 2048
                },
                debug: true
            };

            // 初始化PBR Visualizer
            this.visualizer = new PBRVisualizer(options);

            // 加载默认模型
            await this.loadDefaultModel();

            // 设置事件监听
            this.setupEventListeners();

            // 设置性能监控
            this.setupPerformanceMonitoring();

        } catch (error) {
            console.error('材质编辑器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载默认模型
     */
    private async loadDefaultModel(): Promise<void> {
        try {
            // 尝试加载模型 - 需要先添加模型到models列表
            // const model = await this.visualizer.loadModel('/models/sphere.glb', {
            //     center: true,
            //     scale: 1.0,
            //     generateStudioLighting: true
            // });
            // this.currentModel = model;

            // 暂时创建默认几何体
            console.log('使用默认几何体');
            this.createDefaultGeometry();
        } catch (error) {
            // 如果模型加载失败，创建一个默认球体
            console.log('使用默认几何体');
            this.createDefaultGeometry();
        }
    }

    /**
     * 创建默认几何体
     */
    private createDefaultGeometry(): void {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshStandardMaterial({
            color: this.uiState.currentMaterial.color,
            metalness: this.uiState.currentMaterial.metalness,
            roughness: this.uiState.currentMaterial.roughness
        });
        const mesh = new THREE.Mesh(geometry, material);

        // 需要通过PBRVisualizer的公共API来添加模型
        // this.visualizer.scene.add(mesh);
        this.currentModel = mesh;
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 监听材质参数变化
        this.container.addEventListener('materialChange', (event: any) => {
            const { property, value } = event.detail;
            this.updateMaterial(property, value);
        });

        // 监听工具切换
        this.container.addEventListener('toolChange', (event: any) => {
            const { tool } = event.detail;
            this.setActiveTool(tool);
        });

        // 监听预设应用
        this.container.addEventListener('presetApply', (event: any) => {
            const { preset } = event.detail;
            this.applyPreset(preset);
        });
    }

    /**
     * 设置性能监控
     */
    private setupPerformanceMonitoring(): void {
        setInterval(() => {
            // 获取性能信息 - 需要使用PBRVisualizer的公共API
            // const info = this.visualizer.getPerformanceInfo();
            const mockInfo: PerformanceStats = {
                fps: 60,
                frameTime: 16.67,
                drawCalls: 0,
                triangles: 0,
                memoryUsage: 0,
                gpuMemory: 0
            };

            const event = new CustomEvent('statsUpdate', {
                detail: {
                    fps: Math.round(mockInfo.fps || 60),
                    drawCalls: mockInfo.drawCalls || 0,
                    triangles: mockInfo.triangles || 0,
                    memory: (mockInfo.memoryUsage || 0).toFixed(1)
                }
            });
            this.container.dispatchEvent(event);
        }, 1000);
    }

    /**
     * 更新材质参数
     */
    public updateMaterial(property: string, value: any): void {
        // 更新UI状态
        (this.uiState.currentMaterial as any)[property] = value;

        // 更新材质 - 需要使用PBRVisualizer的公共API
        if (this.currentModel && this.currentModel instanceof THREE.Mesh) {
            const material = this.currentModel.material as THREE.MeshStandardMaterial;
            if (material) {
                (material as any)[property] = value;
                material.needsUpdate = true;
            }
        }

        // 存储材质属性
        this.materialProperties.set(property, value);

        // 触发材质更新事件
        const event = new CustomEvent('materialUpdated', {
            detail: { property, value }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * 应用材质预设
     */
    public applyPreset(presetName: string): void {
        const preset = this.materialPresets[presetName as keyof typeof this.materialPresets];
        if (preset) {
            Object.entries(preset.params).forEach(([key, value]) => {
                this.updateMaterial(key, value);
            });

            // 触发预设应用事件
            const event = new CustomEvent('presetApplied', {
                detail: { preset: presetName }
            });
            this.container.dispatchEvent(event);
        }
    }

    /**
     * 设置活动工具
     */
    public setActiveTool(tool: string): void {
        this.uiState.activeTool = tool;

        // 更新控制器状态
        switch (tool) {
            case 'move':
                // 启用平移控制
                break;
            case 'rotate':
                // 启用旋转控制
                break;
            case 'material':
                // 启用材质编辑
                break;
            case 'light':
                // 启用光照编辑
                break;
        }

        // 触发工具切换事件
        const event = new CustomEvent('toolChanged', {
            detail: { tool }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * 加载模型
     */
    public async loadModel(url: string): Promise<void> {
        try {
            // TODO: 需要实现通过PBRVisualizer API加载模型
            console.log('Loading model from:', url);
            // const model = await this.visualizer.loadModel(url, {
            //     center: true,
            //     scale: 1.0,
            //     generateStudioLighting: true
            // });

            // 暂时创建默认几何体
            this.createDefaultGeometry();

            // 触发模型加载事件
            const event = new CustomEvent('modelLoaded', {
                detail: { model: this.currentModel }
            });
            this.container.dispatchEvent(event);

        } catch (error) {
            console.error('模型加载失败:', error);
            throw error;
        }
    }

    /**
     * 重置材质参数
     */
    public resetMaterial(): void {
        const defaultMaterial = {
            color: '#ffffff',
            metalness: 0.5,
            roughness: 0.5,
            clearcoat: 0.0,
            clearcoatRoughness: 0.0,
            envMapIntensity: 1.0,
            transmission: 0.0,
            thickness: 0.0,
            ior: 1.5
        };

        Object.entries(defaultMaterial).forEach(([key, value]) => {
            this.updateMaterial(key, value);
        });

        // 触发重置事件
        const event = new CustomEvent('materialReset');
        this.container.dispatchEvent(event);
    }

    /**
     * 导出材质配置
     */
    public exportMaterial(): string {
        const config = {
            name: 'Custom Material',
            timestamp: new Date().toISOString(),
            properties: Object.fromEntries(this.materialProperties)
        };

        return JSON.stringify(config, null, 2);
    }

    /**
     * 导入材质配置
     */
    public importMaterial(config: string): void {
        try {
            const materialConfig = JSON.parse(config);
            Object.entries(materialConfig.properties).forEach(([key, value]) => {
                this.updateMaterial(key, value);
            });

            // 触发导入事件
            const event = new CustomEvent('materialImported', {
                detail: { config: materialConfig }
            });
            this.container.dispatchEvent(event);

        } catch (error) {
            console.error('材质配置导入失败:', error);
            throw error;
        }
    }

    /**
     * 截图
     */
    public async takeScreenshot(): Promise<Blob> {
        // TODO: 需要实现通过PBRVisualizer API截图
        return new Blob(['screenshot placeholder'], { type: 'image/png' });
    }

    /**
     * 获取当前材质状态
     */
    public getMaterialState(): any {
        return {
            ...this.uiState.currentMaterial,
            properties: Object.fromEntries(this.materialProperties)
        };
    }

    /**
     * 获取性能信息
     */
    public getPerformanceInfo(): PerformanceStats {
        // TODO: 需要实现通过PBRVisualizer API获取性能信息
        return {
            fps: 60,
            frameTime: 16.67,
            drawCalls: 0,
            triangles: 0,
            memoryUsage: 0,
            gpuMemory: 0
        };
    }

    /**
     * 销毁编辑器
     */
    public dispose(): void {
        if (this.visualizer) {
            this.visualizer.dispose();
        }
    }
}

// 导出类型定义
export interface MaterialProperties {
    color: string;
    metalness: number;
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    envMapIntensity: number;
    transmission: number;
    thickness: number;
    ior: number;
}

export interface MaterialPreset {
    name: string;
    params: Partial<MaterialProperties>;
}

export interface UIState {
    activeTool: string;
    expandedGroups: Record<string, boolean>;
    currentMaterial: MaterialProperties;
}
