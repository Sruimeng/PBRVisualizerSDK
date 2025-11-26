import * as THREE from 'three';
import {
    StateMachineConfig,
    StateMachineState,
    StateTransition,
    StateMachineRuntimeState,
    StateMachineEvent,
    TransitionEffectConfig,
    TransitionEffectType,
    EasingType,
    EasingFunction
} from '../types';

/**
 * 内置缓动函数集合
 */
const EASING_FUNCTIONS: Record<EasingType, EasingFunction> = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    easeInElastic: (t) => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    },
    easeOutElastic: (t) => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    },
    easeInOutElastic: (t) => {
        if (t === 0 || t === 1) return t;
        t *= 2;
        if (t < 1) {
            return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        }
        return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
    }
};

/**
 * 默认过渡效果配置
 */
const DEFAULT_EFFECT: TransitionEffectConfig = {
    type: TransitionEffectType.Fade,
    duration: 500,
    easing: 'easeOutCubic',
    opacityRange: [0.3, 1],  // 增强透明度对比度：从30%可见到完全不透明
    scaleRange: [0.8, 1]
};

/**
 * 预设的过渡效果配置
 */
export const FADE_PRESETS: Record<string, TransitionEffectConfig> = {
    /** 强化淡入淡出 - 更明显的透明度变化 */
    strong: {
        type: TransitionEffectType.Fade,
        duration: 600,
        easing: 'easeOutCubic',
        opacityRange: [0.2, 1],  // 从20%到100%，更强烈的对比
        scaleRange: [0.85, 1]
    },

    /** 戏剧化效果 - 非常明显的视觉冲击 */
    dramatic: {
        type: TransitionEffectType.FadeScale,
        duration: 800,
        easing: 'easeInOutElastic',
        opacityRange: [0.1, 1],  // 从10%到100%，最强烈的对比
        scaleRange: [0.7, 1.1]   // 配合缩放效果
    },

    /** 自然柔和 - 保持自然感但更明显 */
    natural: {
        type: TransitionEffectType.Fade,
        duration: 500,
        easing: 'easeOutCubic',
        opacityRange: [0.5, 1],  // 从半透明到不透明，自然过渡
        scaleRange: [0.95, 1]
    },

    /** 快速切换 - 适合快节奏动画 */
    quick: {
        type: TransitionEffectType.Fade,
        duration: 300,
        easing: 'easeOutQuad',
        opacityRange: [0.4, 1],  // 快速但明显的透明度变化
        scaleRange: [0.9, 1]
    },

    /** 角色动画专用 - 针对角色状态切换优化 */
    character: {
        type: TransitionEffectType.FadeScale,
        duration: 600,
        easing: 'easeOutCubic',
        opacityRange: [0.25, 1],  // 适合角色动画的透明度范围
        scaleRange: [0.92, 1.05] // 轻微的缩放增强效果
    }
};

/**
 * 动画状态机
 *
 * 提供完整的FSM功能：
 * - 状态定义和管理
 * - 状态转换和条件判断
 * - 过渡效果（淡入淡出、缩放）
 * - 动画控制集成
 * - 事件系统
 */
export class AnimationStateMachine {
    private config: StateMachineConfig;
    private model: THREE.Object3D | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    private animations: THREE.AnimationClip[] = [];
    private actions: Map<string, THREE.AnimationAction> = new Map();

    // 状态管理
    private states: Map<string, StateMachineState> = new Map();
    private transitions: Map<string, StateTransition[]> = new Map();
    private currentStateId: string;
    private previousStateId: string | null = null;

    // 过渡状态
    private isTransitioning = false;
    private transitionProgress = 0;
    private transitionStartTime = 0;
    private currentTransition: StateTransition | null = null;
    private currentEffect: TransitionEffectConfig | null = null;

    // 过渡阶段：'fadeOut' | 'fadeIn'
    private transitionPhase: 'fadeOut' | 'fadeIn' = 'fadeOut';
    // 是否已在过渡中点切换过动画
    private hasAnimationSwitched = false;
    // 暂停的动画Action（用于恢复）
    private pausedAction: THREE.AnimationAction | null = null;
    // 暂停时的动画时间
    private pausedActionTime = 0;

    // 原始材质状态（用于恢复）
    private originalMaterials: Map<THREE.Mesh, {
        opacity: number;
        transparent: boolean;
    }> = new Map();
    private originalScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

    // 运行状态
    private isRunning = false;
    private clock = new THREE.Clock(false);
    private stateStartTime = 0;

    // 事件系统
    private eventListeners: Map<string, Function[]> = new Map();

    constructor(config: StateMachineConfig) {
        this.config = config;
        this.currentStateId = config.initialState;

        // 初始化状态和转换映射
        this.initializeStates();
        this.initializeTransitions();

        if (this.config.debug) {
            console.log('[AnimationStateMachine] Created with config:', config);
        }
    }

    /**
     * 初始化状态映射
     */
    private initializeStates(): void {
        this.config.states.forEach(state => {
            this.states.set(state.id, state);
        });
    }

    /**
     * 初始化转换映射
     */
    private initializeTransitions(): void {
        this.config.transitions.forEach(transition => {
            const fromTransitions = this.transitions.get(transition.from) || [];
            fromTransitions.push(transition);
            // 按优先级排序（高优先级在前）
            fromTransitions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            this.transitions.set(transition.from, fromTransitions);
        });
    }

    /**
     * 绑定模型和动画
     */
    public bind(model: THREE.Object3D, animations: THREE.AnimationClip[]): void {
        this.model = model;
        this.animations = animations;

        // 创建AnimationMixer
        this.mixer = new THREE.AnimationMixer(model);

        // 创建所有动画Actions
        animations.forEach(clip => {
            const action = this.mixer!.clipAction(clip);
            this.actions.set(clip.name, action);
            if (this.config.debug) {
                console.log(`[AnimationStateMachine] Registered animation: ${clip.name}`);
            }
        });

        // 保存原始材质状态
        this.saveOriginalMaterialState();

        // 保存原始缩放
        this.originalScale.copy(model.scale);

        // 监听动画完成事件
        this.mixer.addEventListener('finished', (event: any) => {
            this.onAnimationFinished(event.action);
        });

        if (this.config.debug) {
            console.log(`[AnimationStateMachine] Bound to model with ${animations.length} animations`);
        }
    }

    /**
     * 保存原始材质状态
     */
    private saveOriginalMaterialState(): void {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                        this.originalMaterials.set(child, {
                            opacity: material.opacity,
                            transparent: material.transparent
                        });
                    }
                });
            }
        });
    }

    /**
     * 启动状态机
     */
    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.clock.start();

        // 进入初始状态
        this.enterState(this.currentStateId);

        this.emitEvent('stateEnter', this.currentStateId);

        if (this.config.debug) {
            console.log(`[AnimationStateMachine] Started in state: ${this.currentStateId}`);
        }
    }

    /**
     * 停止状态机
     */
    public stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.clock.stop();

        // 停止所有动画
        this.actions.forEach(action => {
            action.stop();
        });

        if (this.config.debug) {
            console.log('[AnimationStateMachine] Stopped');
        }
    }

    /**
     * 更新状态机（需要在渲染循环中调用）
     */
    public update(deltaTime?: number): void {
        if (!this.isRunning) return;

        const dt = deltaTime ?? this.clock.getDelta();

        // 更新AnimationMixer
        if (this.mixer) {
            this.mixer.update(dt);
        }

        // 更新过渡效果
        if (this.isTransitioning) {
            this.updateTransition(dt);
        } else {
            // 检查自动转换条件
            this.checkTransitionConditions();
        }

        // 调用当前状态的onUpdate回调
        const currentState = this.states.get(this.currentStateId);
        if (currentState?.onUpdate) {
            currentState.onUpdate(dt);
        }
    }

    /**
     * 触发状态转换
     */
    public trigger(transitionId: string): boolean {
        if (this.isTransitioning) {
            if (this.config.debug) {
                console.warn('[AnimationStateMachine] Cannot trigger transition while already transitioning');
            }
            return false;
        }

        // 查找转换
        const fromTransitions = this.transitions.get(this.currentStateId) || [];
        const transition = fromTransitions.find(t => t.id === transitionId);

        if (!transition) {
            if (this.config.debug) {
                console.warn(`[AnimationStateMachine] Transition '${transitionId}' not found from state '${this.currentStateId}'`);
            }
            return false;
        }

        this.startTransition(transition);
        return true;
    }

    /**
     * 直接跳转到指定状态
     */
    public goToState(stateId: string, withEffect: boolean = true): boolean {
        if (!this.states.has(stateId)) {
            if (this.config.debug) {
                console.warn(`[AnimationStateMachine] State '${stateId}' not found`);
            }
            return false;
        }

        if (this.isTransitioning) {
            // 强制完成当前过渡
            this.completeTransition();
        }

        if (withEffect) {
            // 创建临时转换
            const tempTransition: StateTransition = {
                id: `temp_${this.currentStateId}_to_${stateId}`,
                from: this.currentStateId,
                to: stateId,
                condition: { type: 'immediate' },
                effect: this.config.defaultEffect || DEFAULT_EFFECT
            };
            this.startTransition(tempTransition);
        } else {
            this.exitState(this.currentStateId);
            this.previousStateId = this.currentStateId;
            this.currentStateId = stateId;
            this.enterState(stateId);
        }

        return true;
    }

    /**
     * 开始状态转换
     */
    private startTransition(transition: StateTransition): void {
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionStartTime = performance.now();
        this.currentTransition = transition;

        // 重置过渡阶段状态
        this.transitionPhase = 'fadeOut';
        this.hasAnimationSwitched = false;
        this.pausedAction = null;
        this.pausedActionTime = 0;

        // 确定使用的过渡效果
        const fromState = this.states.get(transition.from);
        const toState = this.states.get(transition.to);
        this.currentEffect = transition.effect
            || toState?.enterEffect
            || fromState?.exitEffect
            || this.config.defaultEffect
            || DEFAULT_EFFECT;

        // 暂停当前动画并保存状态
        this.pauseCurrentAnimation(fromState);

        // 调用转换开始回调
        transition.onStart?.();

        // 退出当前状态
        this.exitState(transition.from);

        this.emitEvent('transitionStart', transition.to, transition.from);

        if (this.config.debug) {
            console.log(`[AnimationStateMachine] Transition started: ${transition.from} -> ${transition.to}`);
            console.log(`[AnimationStateMachine] Effect type: ${this.currentEffect.type}, duration: ${this.currentEffect.duration}ms`);
        }
    }

    /**
     * 暂停当前动画并保存状态
     */
    private pauseCurrentAnimation(fromState: StateMachineState | undefined): void {
        if (!fromState || !this.mixer) return;

        const animationName = fromState.animationName ||
            (fromState.animationIndex !== undefined ? this.animations[fromState.animationIndex]?.name : undefined);

        if (animationName) {
            const action = this.actions.get(animationName);
            if (action && action.isRunning()) {
                // 保存当前动画时间以便恢复
                this.pausedAction = action;
                this.pausedActionTime = action.time;
                // 暂停动画（保持当前帧）
                action.paused = true;

                if (this.config.debug) {
                    console.log(`[AnimationStateMachine] Paused animation: ${animationName} at time ${this.pausedActionTime}`);
                }
            }
        }
    }

    /**
     * 更新过渡效果
     */
    private updateTransition(_deltaTime: number): void {
        if (!this.currentEffect || !this.currentTransition) return;

        const elapsed = performance.now() - this.transitionStartTime;
        this.transitionProgress = Math.min(1, elapsed / this.currentEffect.duration);

        // 获取缓动后的进度
        const easingFn = EASING_FUNCTIONS[this.currentEffect.easing] || EASING_FUNCTIONS.linear;
        const easedProgress = easingFn(this.transitionProgress);

        // 检测过渡阶段变化（在50%时从fadeOut切换到fadeIn）
        if (this.transitionPhase === 'fadeOut' && this.transitionProgress >= 0.5) {
            this.transitionPhase = 'fadeIn';

            // 在中点切换动画（如果尚未切换）
            if (!this.hasAnimationSwitched) {
                this.hasAnimationSwitched = true;
                this.switchToTargetAnimation();
            }

            if (this.config.debug) {
                console.log(`[AnimationStateMachine] Transition phase changed to: fadeIn`);
            }
        }

        // 应用过渡效果
        this.applyTransitionEffect(easedProgress);

        // 检查过渡是否完成
        if (this.transitionProgress >= 1) {
            this.completeTransition();
        }
    }

    /**
     * 在过渡中点切换到目标状态的动画
     */
    private switchToTargetAnimation(): void {
        if (!this.currentTransition) return;

        const toState = this.states.get(this.currentTransition.to);

        // 停止暂停的动画
        if (this.pausedAction) {
            this.pausedAction.paused = false;
            this.pausedAction.stop();
        }

        // 检查目标状态是否有动画
        if (toState) {
            const targetAnimName = toState.animationName ||
                (toState.animationIndex !== undefined ? this.animations[toState.animationIndex]?.name : undefined);

            if (targetAnimName) {
                // 目标状态有动画，播放新动画
                const action = this.actions.get(targetAnimName);
                if (action) {
                    action.reset();
                    action.play();
                    if (this.config.debug) {
                        console.log(`[AnimationStateMachine] Switched to target animation: ${targetAnimName}`);
                    }
                }
            } else {
                // 目标状态没有动画，恢复原动画
                this.resumePausedAnimation();
            }
        }
    }

    /**
     * 恢复暂停的动画
     */
    private resumePausedAnimation(): void {
        if (this.pausedAction) {
            this.pausedAction.paused = false;
            this.pausedAction.time = this.pausedActionTime;
            this.pausedAction.play();

            if (this.config.debug) {
                console.log(`[AnimationStateMachine] Resumed paused animation at time ${this.pausedActionTime}`);
            }
        }
    }

    /**
     * 应用过渡效果
     */
    private applyTransitionEffect(progress: number): void {
        if (!this.model || !this.currentEffect) return;

        const effectType = this.currentEffect.type;

        // 无过渡效果
        if (effectType === TransitionEffectType.None) {
            return;
        }

        // 淡入淡出效果
        if (effectType === TransitionEffectType.Fade || effectType === TransitionEffectType.FadeScale) {
            const [minOpacity, maxOpacity] = this.currentEffect.opacityRange || [0, 1];
            // 前半段淡出（从maxOpacity到minOpacity），后半段淡入（从minOpacity到maxOpacity）
            let opacity: number;
            if (progress < 0.5) {
                // fadeOut阶段：progress 0->0.5 对应 opacity maxOpacity->minOpacity
                const fadeOutProgress = progress * 2; // 0->1
                opacity = maxOpacity - (maxOpacity - minOpacity) * fadeOutProgress;
            } else {
                // fadeIn阶段：progress 0.5->1 对应 opacity minOpacity->maxOpacity
                const fadeInProgress = (progress - 0.5) * 2; // 0->1
                opacity = minOpacity + (maxOpacity - minOpacity) * fadeInProgress;
            }
            this.setModelOpacity(opacity);

            if (this.config.debug && (progress < 0.02 || (progress > 0.48 && progress < 0.52) || progress > 0.98)) {
                console.log(`[AnimationStateMachine] Opacity: ${opacity.toFixed(2)} at progress ${progress.toFixed(2)}`);
            }
        }

        // 缩放效果
        if (effectType === TransitionEffectType.Scale || effectType === TransitionEffectType.FadeScale) {
            const [minScale, maxScale] = this.currentEffect.scaleRange || [0.8, 1];
            // 前半段缩小，后半段放大
            let scale: number;
            if (progress < 0.5) {
                const scaleOutProgress = progress * 2;
                scale = maxScale - (maxScale - minScale) * scaleOutProgress;
            } else {
                const scaleInProgress = (progress - 0.5) * 2;
                scale = minScale + (maxScale - minScale) * scaleInProgress;
            }
            this.model.scale.setScalar(scale * this.originalScale.x);

            if (this.config.debug && (progress < 0.02 || (progress > 0.48 && progress < 0.52) || progress > 0.98)) {
                console.log(`[AnimationStateMachine] Scale: ${scale.toFixed(2)} at progress ${progress.toFixed(2)}`);
            }
        }
    }

    /**
     * 设置模型透明度
     */
    private setModelOpacity(opacity: number): void {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                        material.transparent = true;
                        material.opacity = opacity;
                        material.needsUpdate = true;
                    }
                });
            }
        });
    }

    /**
     * 完成过渡
     */
    private completeTransition(): void {
        if (!this.currentTransition) return;

        const toStateId = this.currentTransition.to;

        // 恢复材质状态
        this.restoreOriginalMaterialState();

        // 恢复缩放
        if (this.model) {
            this.model.scale.copy(this.originalScale);
        }

        // 更新状态
        this.previousStateId = this.currentStateId;
        this.currentStateId = toStateId;

        // 进入新状态（不重复播放动画，因为已在switchToTargetAnimation中播放）
        const toState = this.states.get(toStateId);
        if (toState) {
            this.stateStartTime = performance.now();
            // 调用onEnter回调
            toState.onEnter?.();
        }

        // 调用转换完成回调
        this.currentTransition.onComplete?.();

        this.emitEvent('transitionEnd', toStateId, this.previousStateId || undefined);

        if (this.config.debug) {
            console.log(`[AnimationStateMachine] Transition completed: ${this.previousStateId} -> ${toStateId}`);
        }

        // 重置过渡状态
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionPhase = 'fadeOut';
        this.hasAnimationSwitched = false;
        this.pausedAction = null;
        this.pausedActionTime = 0;
        this.currentTransition = null;
        this.currentEffect = null;
    }

    /**
     * 恢复原始材质状态
     */
    private restoreOriginalMaterialState(): void {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const original = this.originalMaterials.get(child);
                if (original) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        if (material instanceof THREE.MeshStandardMaterial) {
                            material.opacity = original.opacity;
                            material.transparent = original.transparent;
                            material.needsUpdate = true;
                        }
                    });
                }
            }
        });
    }

    /**
     * 进入状态
     */
    private enterState(stateId: string): void {
        const state = this.states.get(stateId);
        if (!state) return;

        this.stateStartTime = performance.now();

        // 播放状态关联的动画
        this.playStateAnimation(state);

        // 调用onEnter回调
        state.onEnter?.();
    }

    /**
     * 退出状态
     */
    private exitState(stateId: string): void {
        const state = this.states.get(stateId);
        if (!state) return;

        // 调用onExit回调
        state.onExit?.();

        this.emitEvent('stateExit', stateId);
    }

    /**
     * 播放状态关联的动画
     */
    private playStateAnimation(state: StateMachineState): void {
        if (!this.mixer) return;

        // 停止当前所有动画
        this.actions.forEach(action => {
            action.fadeOut(0.3);
        });

        // 确定要播放的动画
        let animationName: string | undefined;

        if (state.animationName) {
            animationName = state.animationName;
        } else if (state.animationIndex !== undefined && this.animations[state.animationIndex]) {
            animationName = this.animations[state.animationIndex].name;
        }

        if (animationName) {
            const action = this.actions.get(animationName);
            if (action) {
                action.reset();
                action.fadeIn(0.3);
                action.play();

                if (this.config.debug) {
                    console.log(`[AnimationStateMachine] Playing animation: ${animationName}`);
                }
            }
        }
    }

    /**
     * 动画完成回调
     */
    private onAnimationFinished(_action: THREE.AnimationAction): void {
        this.emitEvent('animationEnd', this.currentStateId);

        // 检查是否有animationEnd条件的转换
        this.checkTransitionConditions();
    }

    /**
     * 检查转换条件
     */
    private checkTransitionConditions(): void {
        if (this.isTransitioning) return;

        const fromTransitions = this.transitions.get(this.currentStateId) || [];

        for (const transition of fromTransitions) {
            if (this.evaluateCondition(transition.condition)) {
                this.startTransition(transition);
                break;
            }
        }
    }

    /**
     * 评估转换条件
     */
    private evaluateCondition(condition: StateTransition['condition']): boolean {
        switch (condition.type) {
            case 'immediate':
                return false; // immediate需要手动触发

            case 'animationEnd':
                // 检查当前动画是否结束
                const currentState = this.states.get(this.currentStateId);
                if (currentState?.animationName) {
                    const action = this.actions.get(currentState.animationName);
                    if (action && !action.isRunning()) {
                        return true;
                    }
                }
                return false;

            case 'timeout':
                if (condition.timeout) {
                    const elapsed = performance.now() - this.stateStartTime;
                    return elapsed >= condition.timeout;
                }
                return false;

            case 'custom':
                if (condition.predicate) {
                    return condition.predicate();
                }
                return false;

            default:
                return false;
        }
    }

    /**
     * 发送事件
     */
    private emitEvent(
        type: StateMachineEvent['type'],
        currentState: string,
        previousState?: string
    ): void {
        const event: StateMachineEvent = {
            type,
            stateMachineId: this.config.id,
            currentState,
            previousState,
            timestamp: Date.now()
        };

        const listeners = this.eventListeners.get(type) || [];
        listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error(`[AnimationStateMachine] Error in event listener:`, error);
            }
        });
    }

    /**
     * 添加事件监听器
     */
    public on(event: StateMachineEvent['type'], listener: (event: StateMachineEvent) => void): void {
        const listeners = this.eventListeners.get(event) || [];
        listeners.push(listener);
        this.eventListeners.set(event, listeners);
    }

    /**
     * 移除事件监听器
     */
    public off(event: StateMachineEvent['type'], listener: (event: StateMachineEvent) => void): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 获取运行时状态
     */
    public getState(): StateMachineRuntimeState {
        const currentState = this.states.get(this.currentStateId);
        return {
            currentState: this.currentStateId,
            previousState: this.previousStateId,
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress,
            isRunning: this.isRunning,
            currentAnimation: currentState?.animationName || null
        };
    }

    /**
     * 获取所有状态ID
     */
    public getStateIds(): string[] {
        return Array.from(this.states.keys());
    }

    /**
     * 获取指定状态的可用转换
     */
    public getAvailableTransitions(stateId?: string): StateTransition[] {
        const id = stateId || this.currentStateId;
        return this.transitions.get(id) || [];
    }

    /**
     * 获取所有动画名称
     */
    public getAnimationNames(): string[] {
        return this.animations.map(clip => clip.name);
    }

    /**
     * 添加新状态
     */
    public addState(state: StateMachineState): void {
        this.states.set(state.id, state);
    }

    /**
     * 添加新转换
     */
    public addTransition(transition: StateTransition): void {
        const fromTransitions = this.transitions.get(transition.from) || [];
        fromTransitions.push(transition);
        fromTransitions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.transitions.set(transition.from, fromTransitions);
    }

    /**
     * 销毁状态机
     */
    public dispose(): void {
        this.stop();

        // 清理AnimationMixer
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model!);
        }

        // 清理事件监听器
        this.eventListeners.clear();

        // 清理状态
        this.states.clear();
        this.transitions.clear();
        this.actions.clear();
        this.originalMaterials.clear();

        if (this.config.debug) {
            console.log('[AnimationStateMachine] Disposed');
        }
    }
}

/**
 * 导出缓动函数供外部使用
 */
export { EASING_FUNCTIONS };

/**
 * 导出默认效果配置
 */
export { DEFAULT_EFFECT };
