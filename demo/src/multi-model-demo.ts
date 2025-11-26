import {
    PBRVisualizer,
    AnimationStateMachine,
    TransitionEffectType,
    StateMachineEvent,
    VignetteConfig,
    TransformControlsConfig
} from '@sruim/pbr-visualizer-sdk';
import { Vector3, Color, Euler } from 'three';

// 全局类型声明
declare global {
    interface Window {
        switchToState1: () => void;
        switchToState2: () => void;
        toggleStateMachine: () => void;
        setTransitionEffect: (effect: string) => void;
        setDuration: (duration: number) => void;
        focusCamera: (target: string) => void;
        toggleAutoRotate: () => void;
        resetCamera: () => void;
        updateVignette: (modelId: string, param: string, value: number) => void;
        toggleVignette: (modelId: string) => void;
        selectModel: (modelId: string) => void;
        setTransformMode: (mode: string) => void;
    }
}

/**
 * 多模型综合Demo类
 * 演示：
 * - 多模型加载和布局
 * - 动画状态机切换
 * - SDK内置暗角球体背景效果（每个模型独立）
 * - SDK内置TransformControls模型控制
 * - 相机聚焦功能
 */
export class MultiModelDemo {
    private visualizer: PBRVisualizer | null = null;
    private stateMachine: AnimationStateMachine | null = null;

    // 模型ID
    private readonly cameraModelId = 'camera_model';
    private readonly testModelId = 'test_model';

    // 当前选中的模型
    private selectedModelId: string;

    // 状态机配置
    private currentEffect: TransitionEffectType = TransitionEffectType.Fade;
    private currentDuration = 1000;

    // 暗角配置（每个模型独立）
    private vignetteConfigs: Record<string, VignetteConfig> = {};

    constructor() {
        this.selectedModelId = this.testModelId;
        this.init();
    }

    /**
     * 初始化Demo
     */
    private async init(): Promise<void> {
        try {
            // 初始化暗角配置
            const defaultVignetteConfig: VignetteConfig = {
                enabled: true,
                radiusScale: 1.5,
                smoothness: 0.15,
                ringRadius: 0.75,
                noiseIntensity: 0.08,
                color1: new Color(0x0f0c29),
                color2: new Color(0x4a6fa5),
                vignetteRange: 0.85,
                brightness: 0.10
            };

            this.vignetteConfigs[this.cameraModelId] = { ...defaultVignetteConfig };
            this.vignetteConfigs[this.testModelId] = { ...defaultVignetteConfig };

            // TransformControls配置
            const transformConfig: TransformControlsConfig = {
                enabled: true,
                mode: 'rotate',
                size: 0.8
            };

            // 创建 PBR Visualizer 实例，配置两个模型
            this.visualizer = new PBRVisualizer({
                container: document.getElementById('app')!,
                models: [
                    {
                        id: this.cameraModelId,
                        // cspell:disable-next-line
                        source: '../../glb/Camera_XHS_17479384306051040g00831hpgdts3jo6g5pmo3n0nc99qji23br8.glb',
                        initialState: {
                            transform: {
                                position: new Vector3(-2, 0, 0),
                                rotation: new Euler(0, 0, 0),
                                scale: new Vector3(1, 1, 1)
                            },
                            // SDK内置暗角球体
                            vignette: this.vignetteConfigs[this.cameraModelId],
                            // SDK内置TransformControls
                            transformControls: { ...transformConfig, enabled: false }
                        }
                    },
                    {
                        id: this.testModelId,
                        source: '../../glb/test.glb',
                        initialState: {
                            transform: {
                                position: new Vector3(2, 0, 0),
                                rotation: new Euler(0, 0, 0),
                                scale: new Vector3(1, 1, 1)
                            },
                            // SDK内置暗角球体
                            vignette: this.vignetteConfigs[this.testModelId],
                            // SDK内置TransformControls（默认选中test模型）
                            transformControls: transformConfig
                        }
                    }
                ],
                initialGlobalState: {
                    environment: {
                        intensity: 1.0,
                        url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
                    },
                    sceneSettings: {
                        background: new Color(0x1a1a2e), // 深色背景
                        exposure: 1.0,
                    },
                    camera: {
                        position: new Vector3(0, 2, 8),
                        target: new Vector3(0, 0, 0),
                        fov: 50,
                        near: 0.1,
                        far: 1000,
                        controls: {
                            enabled: true,
                            autoRotate: false,
                            autoRotateSpeed: 2.0,
                        },
                    },
                    postProcessing: {
                        enabled: true,
                        toneMapping: {
                            type: 5, // ACESFilmicToneMapping
                            exposure: 1.0,
                            whitePoint: 1.0,
                        },
                        bloom: {
                            enabled: false,
                            strength: 0.3,
                            radius: 0.4,
                            threshold: 0.8,
                        },
                        ssao: {
                            enabled: true,
                            kernelRadius: 4,
                            minDistance: 0.005,
                            maxDistance: 0.1,
                        },
                        antialiasing: {
                            enabled: true,
                            type: 'fxaa' as const,
                        },
                    },
                },
            });

            // 初始化 SDK
            await this.visualizer.initialize();

            // 为test模型创建状态机
            this.createStateMachine();

            // 设置全局函数
            this.setupGlobalFunctions();

            // 显示UI
            this.showUI();

            console.log('[MultiModelDemo] Initialized successfully with SDK vignette and TransformControls');
        } catch (error) {
            console.error('[MultiModelDemo] Initialization failed:', error);
            this.showError(error);
        }
    }

    /**
     * 选择要控制的模型
     */
    public selectModel(modelId: string): void {
        if (!this.visualizer) return;

        this.selectedModelId = modelId;

        // 使用SDK的setActiveTransformControls切换活动控制器
        this.visualizer.setActiveTransformControls(modelId);

        // 确保选中的模型有TransformControls
        this.visualizer.setModelTransformControls(modelId, {
            enabled: true,
            mode: 'rotate',
            size: 0.8
        });

        // 禁用其他模型的TransformControls
        const otherModelId = modelId === this.cameraModelId ? this.testModelId : this.cameraModelId;
        this.visualizer.setModelTransformControls(otherModelId, {
            enabled: false,
            mode: 'rotate'
        });

        this.updateModelSelectUI(modelId);
        console.log(`[MultiModelDemo] Selected model: ${modelId}`);
    }

    /**
     * 设置TransformControls模式
     */
    public setTransformMode(mode: string): void {
        if (!this.visualizer) return;

        if (mode === 'rotate' || mode === 'translate' || mode === 'scale') {
            this.visualizer.setTransformControlsMode(this.selectedModelId, mode);
            this.updateTransformModeUI(mode);
        }
    }

    /**
     * 更新模型选择UI
     */
    private updateModelSelectUI(modelId: string): void {
        const cameraBtn = document.getElementById('select-camera-btn');
        const testBtn = document.getElementById('select-test-btn');

        cameraBtn?.classList.toggle('active', modelId === this.cameraModelId);
        testBtn?.classList.toggle('active', modelId === this.testModelId);
    }

    /**
     * 更新变换模式UI
     */
    private updateTransformModeUI(mode: string): void {
        const rotateBtn = document.getElementById('mode-rotate-btn');
        const translateBtn = document.getElementById('mode-translate-btn');
        const scaleBtn = document.getElementById('mode-scale-btn');

        rotateBtn?.classList.toggle('active', mode === 'rotate');
        translateBtn?.classList.toggle('active', mode === 'translate');
        scaleBtn?.classList.toggle('active', mode === 'scale');
    }

    /**
     * 创建状态机（仅用于test模型）
     */
    private createStateMachine(): void {
        if (!this.visualizer) return;

        // 获取test模型的动画列表
        const animations = this.visualizer.getModelAnimations(this.testModelId);
        console.log('[MultiModelDemo] Available animations for test model:', animations);

        if (animations.length < 2) {
            console.warn('[MultiModelDemo] Test model needs at least 2 animations');
            return;
        }

        // 创建状态机配置
        const config = {
            id: 'testAnimationFSM',
            initialState: 'state1',
            states: [
                {
                    id: 'state1',
                    name: '动画1',
                    animationName: animations[0],
                    onEnter: () => {
                        console.log('[MultiModelDemo] Entered state1');
                        this.updateStateDisplay('state1');
                    },
                    onExit: () => {
                        console.log('[MultiModelDemo] Exiting state1');
                    }
                },
                {
                    id: 'state2',
                    name: '动画2',
                    animationName: animations[1],
                    onEnter: () => {
                        console.log('[MultiModelDemo] Entered state2');
                        this.updateStateDisplay('state2');
                    },
                    onExit: () => {
                        console.log('[MultiModelDemo] Exiting state2');
                    }
                }
            ],
            transitions: [
                {
                    id: 'to_state2',
                    from: 'state1',
                    to: 'state2',
                    condition: { type: 'immediate' as const },
                    effect: this.getCurrentEffectConfig()
                },
                {
                    id: 'to_state1',
                    from: 'state2',
                    to: 'state1',
                    condition: { type: 'immediate' as const },
                    effect: this.getCurrentEffectConfig()
                }
            ],
            debug: true
        };

        // 创建状态机
        this.stateMachine = this.visualizer.createStateMachine(this.testModelId, config);

        if (this.stateMachine) {
            // 添加事件监听
            this.stateMachine.on('stateEnter', (event: StateMachineEvent) => {
                console.log(`[MultiModelDemo] State entered: ${event.currentState}`);
            });

            this.stateMachine.on('transitionStart', () => {
                this.updateTransitionStatus(true);
            });

            this.stateMachine.on('transitionEnd', () => {
                this.updateTransitionStatus(false);
            });

            // 启动状态机
            this.stateMachine.start();
            console.log('[MultiModelDemo] State machine started');
        }
    }

    /**
     * 获取当前过渡效果配置
     */
    private getCurrentEffectConfig() {
        return {
            type: this.currentEffect,
            duration: this.currentDuration,
            easing: 'easeInOutCubic' as const,
            opacityRange: [0, 1] as [number, number],
            scaleRange: [0.3, 1] as [number, number]
        };
    }

    /**
     * 应用动态过渡效果（重建状态机）
     */
    private applyDynamicTransition(targetState: string): void {
        if (!this.stateMachine || !this.visualizer) return;

        const currentState = this.stateMachine.getState().currentState;

        // 移除旧状态机
        this.visualizer.removeStateMachine(this.testModelId, 'testAnimationFSM');

        // 获取动画列表
        const animations = this.visualizer.getModelAnimations(this.testModelId);

        // 创建新的状态机配置
        const config = {
            id: 'testAnimationFSM',
            initialState: currentState,
            states: [
                {
                    id: 'state1',
                    name: '动画1',
                    animationName: animations[0],
                    onEnter: () => {
                        console.log('[MultiModelDemo] Entered state1');
                        this.updateStateDisplay('state1');
                    }
                },
                {
                    id: 'state2',
                    name: '动画2',
                    animationName: animations[1],
                    onEnter: () => {
                        console.log('[MultiModelDemo] Entered state2');
                        this.updateStateDisplay('state2');
                    }
                }
            ],
            transitions: [
                {
                    id: 'to_state2',
                    from: 'state1',
                    to: 'state2',
                    condition: { type: 'immediate' as const },
                    effect: this.getCurrentEffectConfig()
                },
                {
                    id: 'to_state1',
                    from: 'state2',
                    to: 'state1',
                    condition: { type: 'immediate' as const },
                    effect: this.getCurrentEffectConfig()
                }
            ],
            debug: true
        };

        // 创建新状态机
        this.stateMachine = this.visualizer.createStateMachine(this.testModelId, config);

        if (this.stateMachine) {
            this.stateMachine.on('transitionStart', () => this.updateTransitionStatus(true));
            this.stateMachine.on('transitionEnd', () => this.updateTransitionStatus(false));

            this.stateMachine.start();

            // 触发转换
            const transitionId = targetState === 'state1' ? 'to_state1' : 'to_state2';
            this.stateMachine.trigger(transitionId);
        }
    }

    /**
     * 切换到状态1
     */
    public switchToState1(): void {
        if (!this.stateMachine) return;

        const state = this.stateMachine.getState();
        if (state.currentState === 'state1') {
            console.log('[MultiModelDemo] Already in state1');
            return;
        }
        if (state.isTransitioning) {
            console.log('[MultiModelDemo] Transition in progress');
            return;
        }

        this.applyDynamicTransition('state1');
    }

    /**
     * 切换到状态2
     */
    public switchToState2(): void {
        if (!this.stateMachine) return;

        const state = this.stateMachine.getState();
        if (state.currentState === 'state2') {
            console.log('[MultiModelDemo] Already in state2');
            return;
        }
        if (state.isTransitioning) {
            console.log('[MultiModelDemo] Transition in progress');
            return;
        }

        this.applyDynamicTransition('state2');
    }

    /**
     * 切换状态机开关
     */
    public toggleStateMachine(): void {
        if (!this.stateMachine) return;

        const state = this.stateMachine.getState();
        if (state.isRunning) {
            this.stateMachine.stop();
        } else {
            this.stateMachine.start();
        }

        this.updateToggleButton();
    }

    /**
     * 设置过渡效果类型
     */
    public setTransitionEffect(effect: string): void {
        switch (effect) {
            case 'fade':
                this.currentEffect = TransitionEffectType.Fade;
                break;
            case 'scale':
                this.currentEffect = TransitionEffectType.Scale;
                break;
            case 'fadeScale':
                this.currentEffect = TransitionEffectType.FadeScale;
                break;
            case 'none':
                this.currentEffect = TransitionEffectType.None;
                break;
        }
        console.log(`[MultiModelDemo] Transition effect: ${this.currentEffect}`);
    }

    /**
     * 设置过渡时长
     */
    public setDuration(duration: number): void {
        this.currentDuration = duration;
        console.log(`[MultiModelDemo] Transition duration: ${duration}ms`);
    }

    /**
     * 聚焦相机到指定目标
     */
    public focusCamera(target: string): void {
        if (!this.visualizer) return;

        // 通过访问私有属性获取相机和控制器（实际应用中应该通过SDK API）
        const camera = (this.visualizer as any).camera;
        const controls = (this.visualizer as any).controls;

        if (!camera || !controls) return;

        let targetPosition: Vector3;
        let cameraPosition: Vector3;

        switch (target) {
            case 'camera_model':
                targetPosition = new Vector3(-2, 0, 0);
                cameraPosition = new Vector3(-2, 2, 6);
                break;
            case 'test_model':
                targetPosition = new Vector3(2, 0, 0);
                cameraPosition = new Vector3(2, 2, 6);
                break;
            case 'both':
            default:
                targetPosition = new Vector3(0, 0, 0);
                cameraPosition = new Vector3(0, 2, 8);
                break;
        }

        // 动画过渡相机位置
        this.animateCamera(camera, controls, cameraPosition, targetPosition, 800);
    }

    /**
     * 动画相机过渡
     */
    private animateCamera(
        camera: any,
        controls: any,
        targetCamPos: Vector3,
        targetLookAt: Vector3,
        duration: number
    ): void {
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // easeInOutCubic
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            camera.position.lerpVectors(startPos, targetCamPos, eased);
            controls.target.lerpVectors(startTarget, targetLookAt, eased);
            controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 切换自动旋转
     */
    public toggleAutoRotate(): void {
        if (!this.visualizer) return;

        const controls = (this.visualizer as any).controls;
        if (controls) {
            controls.autoRotate = !controls.autoRotate;
            this.updateAutoRotateButton(controls.autoRotate);
        }
    }

    /**
     * 重置相机
     */
    public resetCamera(): void {
        this.focusCamera('both');
    }

    /**
     * 更新暗角参数（使用SDK API）
     */
    public updateVignette(modelId: string, param: string, value: number): void {
        if (!this.visualizer) return;

        const config = this.vignetteConfigs[modelId];
        if (!config) return;

        switch (param) {
            case 'radiusScale':
                config.radiusScale = value;
                break;
            case 'smoothness':
                config.smoothness = value;
                break;
            case 'ringRadius':
                config.ringRadius = value;
                break;
            case 'noiseIntensity':
                config.noiseIntensity = value;
                break;
            case 'vignetteRange':
                config.vignetteRange = value;
                break;
            case 'brightness':
                config.brightness = value;
                break;
        }

        // 使用SDK API更新暗角
        this.visualizer.setModelVignette(modelId, config);
    }

    /**
     * 切换暗角效果（使用SDK API）
     */
    public toggleVignette(modelId: string): void {
        if (!this.visualizer) return;

        const config = this.vignetteConfigs[modelId];
        if (!config) return;

        config.enabled = !config.enabled;
        this.visualizer.setModelVignette(modelId, config);

        // 更新UI
        const btn = document.getElementById(`vignette-toggle-btn-${modelId}`);
        if (btn) {
            btn.textContent = config.enabled ? '关闭暗角' : '开启暗角';
            btn.classList.toggle('active', config.enabled);
        }
    }

    // =====================
    // UI更新方法
    // =====================

    private updateStateDisplay(stateId: string): void {
        const stateLabel = document.getElementById('current-state');
        if (stateLabel) {
            const stateName = stateId === 'state1' ? '动画1' : '动画2';
            stateLabel.textContent = stateName;
        }

        const btn1 = document.getElementById('state1-btn');
        const btn2 = document.getElementById('state2-btn');
        btn1?.classList.toggle('active', stateId === 'state1');
        btn2?.classList.toggle('active', stateId === 'state2');
    }

    private updateTransitionStatus(isTransitioning: boolean): void {
        const statusEl = document.getElementById('transition-status');
        if (statusEl) {
            statusEl.textContent = isTransitioning ? '过渡中...' : '就绪';
            statusEl.classList.toggle('transitioning', isTransitioning);
        }
    }

    private updateToggleButton(): void {
        if (!this.stateMachine) return;

        const btn = document.getElementById('toggle-btn');
        const state = this.stateMachine.getState();

        if (btn) {
            btn.textContent = state.isRunning ? '暂停' : '启动';
            btn.classList.toggle('active', state.isRunning);
        }
    }

    private updateAutoRotateButton(isRotating: boolean): void {
        const btn = document.getElementById('auto-rotate-btn');
        if (btn) {
            btn.textContent = isRotating ? '停止旋转' : '自动旋转';
            btn.classList.toggle('active', isRotating);
        }
    }

    /**
     * 设置全局函数
     */
    private setupGlobalFunctions(): void {
        window.switchToState1 = () => this.switchToState1();
        window.switchToState2 = () => this.switchToState2();
        window.toggleStateMachine = () => this.toggleStateMachine();
        window.setTransitionEffect = (effect: string) => this.setTransitionEffect(effect);
        window.setDuration = (duration: number) => this.setDuration(duration);
        window.focusCamera = (target: string) => this.focusCamera(target);
        window.toggleAutoRotate = () => this.toggleAutoRotate();
        window.resetCamera = () => this.resetCamera();
        window.updateVignette = (modelId: string, param: string, value: number) =>
            this.updateVignette(modelId, param, value);
        window.toggleVignette = (modelId: string) => this.toggleVignette(modelId);
        window.selectModel = (modelId: string) => this.selectModel(modelId);
        window.setTransformMode = (mode: string) => this.setTransformMode(mode);
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
     * 显示错误信息
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

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MultiModelDemo();
});
