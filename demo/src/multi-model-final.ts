import {
    PBRVisualizer,
    AnimationStateMachine,
    TransitionEffectType,
    StateMachineEvent,
    createSketchfabVignetteMaterial,
    createModelVignette,
    updateVignetteCenter
} from '@sruim/pbr-visualizer-sdk';
import * as THREE from 'three';
import { Vector3, Color, Box3 } from 'three';

// 全局类型声明
declare global {
    interface Window {
        switchToModel: (modelId: string) => void;
        getActiveModel: () => string;
        switchToState1: () => void;
        switchToState2: () => void;
        toggleAutoRotate: () => void;
        resetCamera: () => void;
        updateVignette: (param: string, value: number) => void;
        toggleVignette: () => void;
    }
}

/**
 * 多模型控制器接口
 */
interface ModelController {
    id: string;
    modelId: string;
    model: THREE.Object3D;
    camera: THREE.PerspectiveCamera;
    controls: any; // OrbitControls
    vignette: THREE.Mesh;
    boundingBox: THREE.Box3;
    active: boolean;
}

/**
 * 多模型Demo最终版
 * 实现真正的独立控制和Sketchfab风格暗角
 */
export class MultiModelFinal {
    private visualizer: PBRVisualizer | null = null;
    private modelControllers = new Map<string, ModelController>();
    private activeController: ModelController | null = null;
    private stateMachine: AnimationStateMachine | null = null;
    private vignetteEnabled = true;

    // 模型ID
    private readonly modelIds = ['camera_model', 'test_model'];

    // 暗角参数
    private vignetteParams = {
        radius: 0.7,
        softness: 0.3,
        strength: 0.9,
        color: new Color(0x000000)
    };

    constructor() {
        this.init();
    }

    /**
     * 初始化
     */
    private async init(): Promise<void> {
        try {
            // 创建 PBR Visualizer 实例
            this.visualizer = new PBRVisualizer({
                container: document.getElementById('app')!,
                models: [
                    {
                        id: this.modelIds[0],
                        // cspell:disable-next-line
                        source: '../../glb/Camera_XHS_17479384306051040g00831hpgdts3jo6g5pmo3n0nc99qji23br8.glb',
                        initialState: {
                            transform: {
                                position: new Vector3(-2.5, 0, 0),
                                rotation: new THREE.Euler(0, 0, 0),
                                scale: new Vector3(1, 1, 1)
                            }
                        }
                    },
                    {
                        id: this.modelIds[1],
                        source: './../glb/test.glb',
                        initialState: {
                            transform: {
                                position: new Vector3(2.5, 0, 0),
                                rotation: new THREE.Euler(0, 0, 0),
                                scale: new Vector3(1, 1, 1)
                            }
                        }
                    }
                ],
                initialGlobalState: {
                    environment: {
                        intensity: 1.2,
                        url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
                    },
                    sceneSettings: {
                        background: new Color(0x0a0a0a), // 深色背景
                        exposure: 1.2,
                    },
                    camera: {
                        position: new Vector3(0, 2, 8),
                        target: new Vector3(0, 0, 0),
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                        controls: {
                            enabled: false, // 禁用默认控制器
                            autoRotate: false,
                            autoRotateSpeed: 1.0,
                        },
                    },
                    postProcessing: {
                        enabled: true,
                        toneMapping: {
                            type: 5,
                            exposure: 1.2,
                            whitePoint: 1.0,
                        },
                        bloom: {
                            enabled: false,
                        },
                        ssao: {
                            enabled: true,
                            kernelRadius: 3,
                        },
                        antialiasing: {
                            enabled: true,
                            type: 'fxaa' as const,
                        },
                    },
                },
            });

            await this.visualizer.initialize();

            // 创建模型控制器
            await this.createModelControllers();

            // 创建状态机
            this.createStateMachine();

            // 设置交互
            this.setupInteraction();

            // 设置全局函数
            this.setupGlobalFunctions();

            // 显示UI
            this.showUI();

            // 开始渲染循环
            this.startRenderLoop();

            console.log('[MultiModelFinal] Initialized successfully');
        } catch (error) {
            console.error('[MultiModelFinal] Initialization failed:', error);
            this.showError(error);
        }
    }

    /**
     * 创建模型控制器
     */
    private async createModelControllers(): Promise<void> {
        if (!this.visualizer) return;

        const scene = (this.visualizer as any).scene;

        for (const modelId of this.modelIds) {
            const model = this.visualizer.getModel(modelId);
            if (!model) continue;

            // 计算包围盒
            const boundingBox = new Box3().setFromObject(model);
            const center = boundingBox.getCenter(new Vector3());
            const size = boundingBox.getSize(new Vector3());

            // 创建独立的相机
            const camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );

            // 设置相机位置（根据模型大小调整）
            const distance = Math.max(size.x, size.y, size.z) * 2.5;
            const cameraPosition = new Vector3(
                center.x + distance * 0.8,
                center.y + distance * 0.3,
                center.z + distance
            );

            camera.position.copy(cameraPosition);
            camera.lookAt(center);

            // 创建独立的控制器
            const OrbitControls = (await import('three/examples/jsm/controls/OrbitControls.js')).OrbitControls;
            const controls = new OrbitControls(camera, document.getElementById('app')!);
            controls.target.copy(center);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enableZoom = true;
            controls.enableRotate = true;
            controls.enablePan = true;
            controls.enabled = false; // 默认禁用，只激活当前模型

            // 创建Sketchfab风格的暗角
            const vignette = createModelVignette(boundingBox, camera, {
                uRadius: this.vignetteParams.radius,
                uSoftness: this.vignetteParams.softness,
                uStrength: this.vignetteParams.strength,
                uColor: this.vignetteParams.color
            });

            // 添加到场景
            scene.add(vignette);

            // 创建控制器对象
            const controller: ModelController = {
                id: `${modelId}_controller`,
                modelId,
                model,
                camera,
                controls,
                vignette,
                boundingBox,
                active: false
            };

            this.modelControllers.set(modelId, controller);
        }

        // 激活第一个模型
        this.switchToModel(this.modelIds[1]);
    }

    /**
     * 切换到指定模型
     */
    public switchToModel(modelId: string): void {
        const controller = this.modelControllers.get(modelId);
        if (!controller) return;

        // 停用所有控制器
        for (const [id, ctrl] of this.modelControllers) {
            ctrl.active = false;
            ctrl.controls.enabled = false;
            ctrl.vignette.visible = false;
        }

        // 激活指定控制器
        controller.active = true;
        controller.controls.enabled = true;
        controller.vignette.visible = this.vignetteEnabled;

        // 更新活跃控制器引用
        this.activeController = controller;

        // 更新UI
        this.updateModelDisplay(modelId);

        console.log(`[MultiModelFinal] Switched to model: ${modelId}`);
    }

    /**
     * 获取当前活跃模型
     */
    public getActiveModel(): string {
        return this.activeController ? this.activeController.modelId : '';
    }

    /**
     * 创建状态机
     */
    private createStateMachine(): void {
        if (!this.visualizer) return;

        // 只为test模型创建状态机
        const animations = this.visualizer.getModelAnimations('test_model');
        if (animations.length < 2) return;

        const config = {
            id: 'testAnimationFSM',
            initialState: 'state1',
            states: [
                {
                    id: 'state1',
                    name: '动画1',
                    animationName: animations[0],
                },
                {
                    id: 'state2',
                    name: '动画2',
                    animationName: animations[1],
                }
            ],
            transitions: [
                {
                    id: 'to_state2',
                    from: 'state1',
                    to: 'state2',
                    condition: { type: 'immediate' as const },
                    effect: {
                        type: TransitionEffectType.Fade,
                        duration: 500,
                        easing: 'easeOutCubic' as const,
                        opacityRange: [0.3, 1],
                    }
                },
                {
                    id: 'to_state1',
                    from: 'state2',
                    to: 'state1',
                    condition: { type: 'immediate' as const },
                    effect: {
                        type: TransitionEffectType.Fade,
                        duration: 500,
                        easing: 'easeOutCubic' as const,
                        opacityRange: [0.3, 1],
                    }
                }
            ],
        };

        this.stateMachine = this.visualizer.createStateMachine('test_model', config);
        if (this.stateMachine) {
            this.stateMachine.start();
        }
    }

    /**
     * 设置交互
     */
    private setupInteraction(): void {
        // 鼠标点击事件
        document.getElementById('app')?.addEventListener('click', (event) => {
            if (!this.activeController || !this.visualizer) return;

            // 射线检测
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.activeController.camera);

            // 获取所有模型
            const models = Array.from(this.modelControllers.values()).map(c => c.model);
            const intersects = raycaster.intersectObjects(models, true);

            if (intersects.length > 0) {
                // 找到被点击的模型
                for (const [modelId, controller] of this.modelControllers) {
                    if (this.isObjectInHierarchy(intersects[0].object, controller.model)) {
                        this.switchToModel(modelId);
                        break;
                    }
                }
            }
        });

        // 窗口大小变化
        window.addEventListener('resize', () => {
            for (const controller of this.modelControllers.values()) {
                controller.camera.aspect = window.innerWidth / window.innerHeight;
                controller.camera.updateProjectionMatrix();
            }
        });
    }

    /**
     * 开始渲染循环
     */
    private startRenderLoop(): void {
        const animate = () => {
            requestAnimationFrame(animate);

            if (!this.visualizer || !this.activeController) return;

            // 更新当前控制器
            this.activeController.controls.update();

            // 更新暗角中心位置
            const modelCenter = this.activeController.boundingBox.getCenter(new Vector3());
            updateVignetteCenter(
                this.activeController.vignette,
                modelCenter,
                this.activeController.camera,
                window.innerWidth,
                window.innerHeight
            );

            // 使用活跃控制器的相机进行渲染
            const scene = (this.visualizer as any).scene;
            const renderer = (this.visualizer as any).renderer;

            // 先渲染模型
            renderer.render(scene, this.activeController.camera);

            // 再渲染暗角（如果启用）
            if (this.vignetteEnabled && this.activeController.vignette.visible) {
                renderer.render(scene, this.activeController.camera);
            }
        };

        animate();
    }

    /**
     * 切换状态
     */
    public switchToState1(): void {
        if (this.stateMachine) {
            this.stateMachine.trigger('to_state1');
        }
    }

    public switchToState2(): void {
        if (this.stateMachine) {
            this.stateMachine.trigger('to_state2');
        }
    }

    /**
     * 切换自动旋转
     */
    public toggleAutoRotate(): void {
        if (this.activeController) {
            this.activeController.controls.autoRotate = !this.activeController.controls.autoRotate;
        }
    }

    /**
     * 重置相机
     */
    public resetCamera(): void {
        if (!this.activeController) return;

        const controller = this.activeController;
        const center = controller.boundingBox.getCenter(new Vector3());
        const size = controller.boundingBox.getSize(new Vector3());
        const distance = Math.max(size.x, size.y, size.z) * 2.5;

        const targetPosition = new Vector3(
            center.x + distance * 0.8,
            center.y + distance * 0.3,
            center.z + distance
        );

        // 平滑过渡到目标位置
        const duration = 800;
        const startPos = controller.camera.position.clone();
        const startTarget = controller.controls.target.clone();
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // easeInOutCubic
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            controller.camera.position.lerpVectors(startPos, targetPosition, eased);
            controller.controls.target.lerpVectors(startTarget, center, eased);
            controller.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 更新暗角参数
     */
    public updateVignette(param: string, value: number): void {
        switch (param) {
            case 'radius':
                this.vignetteParams.radius = value;
                break;
            case 'softness':
                this.vignetteParams.softness = value;
                break;
            case 'strength':
                this.vignetteParams.strength = value;
                break;
        }

        // 更新所有暗角
        for (const controller of this.modelControllers.values()) {
            const material = controller.vignette.material as THREE.ShaderMaterial;
            if (material.uniforms[param]) {
                material.uniforms[param].value = value;
            }
        }
    }

    /**
     * 切换暗角
     */
    public toggleVignette(): void {
        this.vignetteEnabled = !this.vignetteEnabled;

        for (const controller of this.modelControllers.values()) {
            if (controller.active) {
                controller.vignette.visible = this.vignetteEnabled;
            }
        }
    }

    /**
     * 检查对象是否在层级中
     */
    private isObjectInHierarchy(target: THREE.Object3D, root: THREE.Object3D): boolean {
        let current: THREE.Object3D | null = target;
        while (current) {
            if (current === root) return true;
            current = current.parent;
        }
        return false;
    }

    /**
     * 更新模型显示
     */
    private updateModelDisplay(modelId: string): void {
        const modelName = modelId === 'camera_model' ? '相机模型' : '测试模型';
        const activeModelLabel = document.getElementById('active-model');
        if (activeModelLabel) {
            activeModelLabel.textContent = modelName;
        }

        // 更新按钮状态
        const cameraBtn = document.getElementById('camera-model-btn');
        const testBtn = document.getElementById('test-model-btn');

        cameraBtn?.classList.toggle('active', modelId === 'camera_model');
        testBtn?.classList.toggle('active', modelId === 'test_model');
    }

    /**
     * 设置全局函数
     */
    private setupGlobalFunctions(): void {
        window.switchToModel = (modelId: string) => this.switchToModel(modelId);
        window.getActiveModel = () => this.getActiveModel();
        window.switchToState1 = () => this.switchToState1();
        window.switchToState2 = () => this.switchToState2();
        window.toggleAutoRotate = () => this.toggleAutoRotate();
        window.resetCamera = () => this.resetCamera();
        window.updateVignette = (param: string, value: number) => this.updateVignette(param, value);
        window.toggleVignette = () => this.toggleVignette();
    }

    /**
     * 显示UI
     */
    private showUI(): void {
        const loading = document.getElementById('loading');
        const controls = document.getElementById('controls');

        if (loading) loading.style.display = 'none';
        if (controls) controls.style.display = 'block';
    }

    /**
     * 显示错误
     */
    private showError(error: any): void {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerHTML = `
            <h3>初始化失败</h3>
            <p>${error.message || error}</p>
            <button onclick="location.reload()">重新加载</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new MultiModelFinal();
});
