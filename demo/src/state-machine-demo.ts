import {
    PBRVisualizer,
    AnimationStateMachine,
    TransitionEffectType,
    StateMachineEvent
} from '@sruim/pbr-visualizer-sdk';
import { Vector3, Color } from 'three';

// 全局类型声明
declare global {
    interface Window {
        switchToState1: () => void;
        switchToState2: () => void;
        toggleStateMachine: () => void;
        setTransitionEffect: (effect: string) => void;
        setDuration: (duration: number) => void;
    }
}

/**
 * 状态机Demo类
 * 演示动画状态机的使用，包括：
 * - 状态定义和切换
 * - 淡入淡出过渡效果
 * - 缩放过渡效果
 * - 事件监听
 */
export class StateMachineDemo {
    private visualizer: PBRVisualizer | null = null;
    private stateMachine: AnimationStateMachine | null = null;
    private readonly modelId = 'test_model';

    // 当前过渡效果配置
    private currentEffect: TransitionEffectType = TransitionEffectType.Fade;
    private currentDuration = 1000; // 默认1秒，更明显

    constructor() {
        this.init();
    }

    /**
     * 初始化Demo
     */
    private async init(): Promise<void> {
        try {
            // 创建 PBR Visualizer 实例
            this.visualizer = new PBRVisualizer({
                container: document.getElementById('app')!,
                models: [
                    {
                        id: this.modelId,
                        source: '../../glb/test.glb',
                    },
                ],
                initialGlobalState: {
                    environment: {
                        intensity: 1.0,
                        url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
                    },
                    sceneSettings: {
                        background: new Color(0x1a1a1a),
                        exposure: 1.0,
                    },
                    camera: {
                        position: new Vector3(2, 2, 5),
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

            // 等待模型加载完成后创建状态机
            this.createStateMachine();

            // 设置控制器
            this.setupGlobalFunctions();

            // 显示UI
            this.showUI();

            console.log('StateMachineDemo initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError(error);
        }
    }

    /**
     * 创建状态机
     */
    private createStateMachine(): void {
        if (!this.visualizer) return;

        // 获取模型动画列表
        const animations = this.visualizer.getModelAnimations(this.modelId);
        console.log('[StateMachineDemo] Available animations:', animations);

        if (animations.length < 2) {
            console.warn('[StateMachineDemo] Model needs at least 2 animations for this demo');
            return;
        }

        // 创建状态机配置
        const config = {
            id: 'animationFSM',
            initialState: 'state1',
            states: [
                {
                    id: 'state1',
                    name: '动画1',
                    animationName: animations[0], // NlaTrack
                    onEnter: () => {
                        console.log('[StateMachineDemo] Entered state1');
                        this.updateStateDisplay('state1');
                    },
                    onExit: () => {
                        console.log('[StateMachineDemo] Exiting state1');
                    }
                },
                {
                    id: 'state2',
                    name: '动画2',
                    animationName: animations[1], // NlaTrack.001
                    onEnter: () => {
                        console.log('[StateMachineDemo] Entered state2');
                        this.updateStateDisplay('state2');
                    },
                    onExit: () => {
                        console.log('[StateMachineDemo] Exiting state2');
                    }
                }
            ],
            transitions: [
                {
                    id: 'to_state2',
                    from: 'state1',
                    to: 'state2',
                    condition: { type: 'immediate' as const },
                    effect: {
                        type: this.currentEffect,
                        duration: this.currentDuration,
                        easing: 'easeOutCubic' as const,
                        opacityRange: [0, 1] as [number, number],
                        scaleRange: [0.5, 1] as [number, number]
                    }
                },
                {
                    id: 'to_state1',
                    from: 'state2',
                    to: 'state1',
                    condition: { type: 'immediate' as const },
                    effect: {
                        type: this.currentEffect,
                        duration: this.currentDuration,
                        easing: 'easeOutCubic' as const,
                        opacityRange: [0, 1] as [number, number],
                        scaleRange: [0.5, 1] as [number, number]
                    }
                }
            ],
            debug: true
        };

        // 创建状态机
        this.stateMachine = this.visualizer.createStateMachine(this.modelId, config);

        if (this.stateMachine) {
            // 添加事件监听
            this.stateMachine.on('stateEnter', (event: StateMachineEvent) => {
                console.log(`[StateMachineDemo] State entered: ${event.currentState}`);
            });

            this.stateMachine.on('transitionStart', (event: StateMachineEvent) => {
                console.log(`[StateMachineDemo] Transition started: ${event.previousState} -> ${event.currentState}`);
                this.updateTransitionStatus(true);
            });

            this.stateMachine.on('transitionEnd', (event: StateMachineEvent) => {
                console.log(`[StateMachineDemo] Transition ended: ${event.currentState}`);
                this.updateTransitionStatus(false);
            });

            // 启动状态机
            this.stateMachine.start();
            console.log('[StateMachineDemo] State machine started');
        }
    }

    /**
     * 切换到状态1
     */
    public switchToState1(): void {
        if (!this.stateMachine) return;

        const state = this.stateMachine.getState();
        if (state.currentState === 'state1') {
            console.log('[StateMachineDemo] Already in state1');
            return;
        }

        if (state.isTransitioning) {
            console.log('[StateMachineDemo] Transition in progress, please wait');
            return;
        }

        // 使用动态更新的过渡效果
        this.applyDynamicTransition('state1');
    }

    /**
     * 切换到状态2
     */
    public switchToState2(): void {
        if (!this.stateMachine) return;

        const state = this.stateMachine.getState();
        if (state.currentState === 'state2') {
            console.log('[StateMachineDemo] Already in state2');
            return;
        }

        if (state.isTransitioning) {
            console.log('[StateMachineDemo] Transition in progress, please wait');
            return;
        }

        // 使用动态更新的过渡效果
        this.applyDynamicTransition('state2');
    }

    /**
     * 应用动态过渡效果
     */
    private applyDynamicTransition(targetState: string): void {
        if (!this.stateMachine || !this.visualizer) return;

        // 先移除旧状态机
        this.visualizer.removeStateMachine(this.modelId, 'animationFSM');

        // 获取动画列表
        const animations = this.visualizer.getModelAnimations(this.modelId);

        // 创建新的状态机配置，使用当前的过渡效果设置
        const config = {
            id: 'animationFSM',
            initialState: this.stateMachine.getState().currentState, // 从当前状态开始
            states: [
                {
                    id: 'state1',
                    name: '动画1',
                    animationName: animations[0],
                    onEnter: () => {
                        console.log('[StateMachineDemo] Entered state1');
                        this.updateStateDisplay('state1');
                    }
                },
                {
                    id: 'state2',
                    name: '动画2',
                    animationName: animations[1],
                    onEnter: () => {
                        console.log('[StateMachineDemo] Entered state2');
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
        this.stateMachine = this.visualizer.createStateMachine(this.modelId, config);

        if (this.stateMachine) {
            // 添加事件监听
            this.stateMachine.on('transitionStart', () => this.updateTransitionStatus(true));
            this.stateMachine.on('transitionEnd', () => this.updateTransitionStatus(false));

            // 启动并触发转换
            this.stateMachine.start();

            // 触发转换到目标状态
            const transitionId = targetState === 'state1' ? 'to_state1' : 'to_state2';
            this.stateMachine.trigger(transitionId);
        }
    }

    /**
     * 获取当前过渡效果配置
     */
    private getCurrentEffectConfig() {
        return {
            type: this.currentEffect,
            duration: this.currentDuration,
            easing: 'easeInOutCubic' as const, // 使用更平滑的缓动
            opacityRange: [0, 1] as [number, number],
            scaleRange: [0.3, 1] as [number, number] // 更明显的缩放范围
        };
    }

    /**
     * 切换状态机开关
     */
    public toggleStateMachine(): void {
        if (!this.stateMachine) return;

        const state = this.stateMachine.getState();
        if (state.isRunning) {
            this.stateMachine.stop();
            console.log('[StateMachineDemo] State machine stopped');
        } else {
            this.stateMachine.start();
            console.log('[StateMachineDemo] State machine started');
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
        console.log(`[StateMachineDemo] Transition effect set to: ${this.currentEffect}`);
    }

    /**
     * 设置过渡时长
     */
    public setDuration(duration: number): void {
        this.currentDuration = duration;
        console.log(`[StateMachineDemo] Transition duration set to: ${duration}ms`);
    }

    /**
     * 更新状态显示
     */
    private updateStateDisplay(stateId: string): void {
        const stateLabel = document.getElementById('current-state');
        if (stateLabel) {
            const stateName = stateId === 'state1' ? '动画1 (NlaTrack)' : '动画2 (NlaTrack.001)';
            stateLabel.textContent = stateName;
        }

        // 更新按钮状态
        const btn1 = document.getElementById('state1-btn');
        const btn2 = document.getElementById('state2-btn');

        btn1?.classList.toggle('active', stateId === 'state1');
        btn2?.classList.toggle('active', stateId === 'state2');
    }

    /**
     * 更新过渡状态显示
     */
    private updateTransitionStatus(isTransitioning: boolean): void {
        const statusEl = document.getElementById('transition-status');
        if (statusEl) {
            statusEl.textContent = isTransitioning ? '过渡中...' : '就绪';
            statusEl.classList.toggle('transitioning', isTransitioning);
        }
    }

    /**
     * 更新切换按钮
     */
    private updateToggleButton(): void {
        if (!this.stateMachine) return;

        const btn = document.getElementById('toggle-btn');
        const state = this.stateMachine.getState();

        if (btn) {
            btn.textContent = state.isRunning ? '⏸️ 暂停' : '▶️ 启动';
            btn.classList.toggle('active', state.isRunning);
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
    new StateMachineDemo();
});
