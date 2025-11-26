import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import {
    GlobalState,
    ModelState,
    SceneState,
    VisualizerOptions,
    BatchUpdate,
    StateTransaction,
    PerformanceStats,
    ErrorEvent,
    StateMachineConfig
} from './types';

import { Renderer } from './core/Renderer';
import { EnvironmentSystem } from './core/EnvironmentSystem';
import { LightSystem } from './core/LightSystem';
import { PostProcessSystem } from './core/PostProcessSystem';
import { MaterialSystem } from './core/MaterialSystem';
import { DebugSystem } from './core/DebugSystem';
import { AnimationStateMachine } from './core/AnimationStateMachine';

/**
 * PBR可视化器主类
 *
 * 提供统一的API来管理：
 * - 3D场景渲染
 * - 模型加载和管理
 * - 状态管理
 * - 材质编辑
 * - 灯光配置
 * - 后处理效果
 * - 性能监控
 */
export class PBRVisualizer {
    // 核心系统
    private renderer!: Renderer;
    private environmentSystem!: EnvironmentSystem;
    private lightSystem!: LightSystem;
    private postProcessSystem!: PostProcessSystem;
    private materialSystem!: MaterialSystem;
    private debugSystem!: DebugSystem;

    // 场景组件
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private controls!: OrbitControls;

    // 状态管理
    private currentState!: SceneState;
    private transactionHistory: StateTransaction[] = [];
    private currentTransactionIndex = -1;

    // 模型管理
    private models = new Map<string, THREE.Object3D>();
    private modelAnimations = new Map<string, THREE.AnimationClip[]>();
    private modelMixers = new Map<string, THREE.AnimationMixer>();
    private gltfLoader!: GLTFLoader;
    private dracoLoader!: DRACOLoader;

    // 状态机管理
    private stateMachines = new Map<string, AnimationStateMachine>();

    // 事件系统
    private eventListeners = new Map<string, Function[]>();

    // 配置选项
    private options: VisualizerOptions;

    // 状态标志
    private isInitialized = false;
    private isDisposed = false;

    constructor(options: VisualizerOptions) {
        this.options = options; // 保存配置选项
        this.initializeOptions(options);
        this.setupCoreSystems();
        this.setupLoader();
        this.setupEventListeners();

        console.log('PBRVisualizer created');
    }

    /**
     * 初始化选项
     */
    private initializeOptions(options: VisualizerOptions): void {
        // 创建默认全局状态
        const defaultGlobalState: GlobalState = {
            environment: {
                url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr',
                intensity: 1.0
            },
            sceneSettings: {
                background: new THREE.Color(0x000000),
                exposure: 1.0,
                toneMapping: THREE.ACESFilmicToneMapping
            },
            camera: {
                position: new THREE.Vector3(3, 2, 5),
                target: new THREE.Vector3(0, 0, 0),
                fov: 40,
                near: 0.1,
                far: 1000,
                controls: {
                    enabled: true,
                    autoRotate: false,
                    autoRotateSpeed: 1.0
                }
            }
        };

        // 初始化模型状态映射
        const modelsState: Record<string, ModelState> = {};

        // 为每个模型创建初始状态
        options.models.forEach(modelConfig => {
            // 创建默认模型状态
            const defaultModelState: ModelState = {
                animations: [],
                visible: true,
                transform: {
                    position: new THREE.Vector3(0, 0, 0),
                    rotation: new THREE.Euler(0, 0, 0),
                    scale: new THREE.Vector3(1, 1, 1)
                },
                // 默认材质配置
                material: {
                    color: '#ffffff',
                    metalness: 0.5,
                    roughness: 0.5,
                    envMapIntensity: 1.0
                },
                // 默认控制器配置
                controls: {
                    enabled: true,
                    autoRotate: false,
                    autoRotateSpeed: 1.0
                }
            };

            // 合并用户提供的初始状态
            modelsState[modelConfig.id] = {
                ...defaultModelState,
                ...modelConfig.initialState
            };
        });

        // 合并用户配置
        this.currentState = {
            global: { ...defaultGlobalState, ...options.initialGlobalState },
            models: modelsState
        };
    }

    /**
     * 设置核心系统
     */
    private setupCoreSystems(): void {
        // 创建渲染器
        this.renderer = new Renderer();

        // 获取场景和相机引用
        this.scene = this.renderer.scene;
        this.camera = this.renderer.camera;

        // 创建子系统
        this.environmentSystem = new EnvironmentSystem(this.renderer.renderer, this.scene);
        this.lightSystem = new LightSystem(this.scene);
        this.postProcessSystem = new PostProcessSystem(
            this.renderer.renderer,
            this.scene,
            this.camera,
            window.innerWidth,
            window.innerHeight
        );
        this.materialSystem = new MaterialSystem(this.renderer.renderer);

        // 创建调试系统
        this.debugSystem = new DebugSystem(
            this.lightSystem,
            this.postProcessSystem,
            this.options.container,
            () => this.getPerformanceStats(),
            this.options.debugConfig
        );

        // 设置轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.canvas);
    }

    /**
     * 设置加载器
     */
    private setupLoader(): void {
        this.gltfLoader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://unpkg.com/three@0.181.0/examples/jsm/libs/draco/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * 初始化可视化器
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('PBRVisualizer is already initialized');
            return;
        }

        try {
            // 初始化渲染器，传递容器参数
            await this.renderer.initialize({
                container: this.options.container
            });

            // 应用全局状态
            await this.applyGlobalState(this.currentState.global);

            // 加载所有配置的模型
            await this.loadInitialModels();

            // 设置轨道控制器
            this.setupControls();

            // 开始渲染循环
            this.startRenderLoop();

            this.isInitialized = true;
            this.emit('initialized');

            console.log('PBRVisualizer initialized successfully');
        } catch (error) {
            this.handleError('state', error as Error);
            throw error;
        }
    }

    /**
     * 加载初始模型
     */
    private async loadInitialModels(): Promise<void> {
        const loadPromises = this.options.models.map(async (modelConfig) => {
            try {
                await this.loadModel(
                    modelConfig.id,
                    modelConfig.source,
                    modelConfig.initialState
                );
            } catch (error) {
                console.error(`Failed to load model ${modelConfig.id}:`, error);
                // 继续加载其他模型,不因一个模型失败而中断
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * 应用全局状态
     */
    private async applyGlobalState(state: GlobalState): Promise<void> {
        // 应用环境配置
        if (state.environment) {
            await this.environmentSystem.setEnvironment(state.environment);
        }

        // 应用场景设置（由渲染器处理）
        this.renderer.applyGlobalState(state);

        // 应用后处理配置
        if (state.postProcessing) {
            this.postProcessSystem.setConfig(state.postProcessing);
        }

        // 应用相机设置
        if (state.camera) {
            this.applyCameraState(state.camera);
        }
    }

    /**
     * 应用相机状态
     */
    private applyCameraState(state: GlobalState['camera']): void {
        if (!state) return;

        this.camera.position.copy(state.position);
        this.camera.lookAt(state.target);
        this.camera.fov = state.fov;
        this.camera.updateProjectionMatrix();

        // 设置控制器
        if (state.controls) {
            this.controls.enabled = state.controls.enabled;
            this.controls.autoRotate = state.controls.autoRotate;
            this.controls.autoRotateSpeed = state.controls.autoRotateSpeed;
        }
    }

    /**
     * 设置轨道控制器
     */
    private setupControls(): void {
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        const cameraConfig = this.currentState.global.camera;
        if (cameraConfig?.controls) {
            this.controls.autoRotate = cameraConfig.controls.autoRotate;
            this.controls.autoRotateSpeed = cameraConfig.controls.autoRotateSpeed;
        }
    }

    /**
     * 开始渲染循环
     */
    private startRenderLoop(): void {
        const clock = new THREE.Clock();

        const animate = () => {
            if (this.isDisposed) return;

            requestAnimationFrame(animate);

            const deltaTime = clock.getDelta();

            // 更新控制器
            this.controls.update();

            // 更新所有AnimationMixer
            this.modelMixers.forEach((mixer) => {
                mixer.update(deltaTime);
            });

            // 更新所有状态机
            this.stateMachines.forEach((stateMachine) => {
                stateMachine.update(deltaTime);
            });

            // 渲染场景
            this.postProcessSystem.render();

            // 更新性能统计
            this.updatePerformanceStats();
        };

        animate();
    }

    /**
     * 加载模型
     */
    public async loadModel(id: string, url: string, initialState?: Partial<ModelState>): Promise<void> {
        if (this.models.has(id)) {
            console.warn(`Model with id '${id}' already exists`);
            return;
        }

        try {
            const startTime = performance.now();

            const gltf = await new Promise<any>((resolve, reject) => {
                this.gltfLoader.load(
                    url,
                    resolve,
                    undefined,
                    reject
                );
            });

            // 处理模型
            const model = gltf.scene;
            this.processModel(model);

            // 添加到场景
            this.scene.add(model);
            this.models.set(id, model);

            // 保存动画
            const animations: THREE.AnimationClip[] = gltf.animations || [];
            this.modelAnimations.set(id, animations);

            // 创建AnimationMixer（如果有动画）
            if (animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                this.modelMixers.set(id, mixer);
                console.log(`[PBRVisualizer] Model '${id}' has ${animations.length} animations:`,
                    animations.map((anim: THREE.AnimationClip) => anim.name));
            }

            // 创建模型状态
            this.currentState.models[id] = {
                animations: animations.map((_clip: THREE.AnimationClip, index: number) => ({
                    id: `${id}_anim_${index}`,
                    enabled: false,
                    currentAnimation: index,
                    speed: 1.0,
                    loop: true,
                    playing: false
                })),
                material: initialState?.material || this.materialSystem.createPresetMaterial('metal'),
                visible: true,
                transform: {
                    position: new THREE.Vector3(),
                    rotation: new THREE.Euler(),
                    scale: new THREE.Vector3(1, 1, 1)
                },
                ...initialState
            };

            // 设置Studio灯光
            this.setupStudioLighting(model);

            const loadTime = performance.now() - startTime;

            // 发送事件
            this.emit('modelLoaded', {
                modelId: id,
                loadTime,
                triangleCount: this.countTriangles(model)
            });

            console.log(`Model loaded: ${id}`);

        } catch (error) {
            this.handleError('load', error as Error, { modelId: id, url });
            throw error;
        }
    }

    /**
     * 处理模型
     */
    private processModel(model: THREE.Object3D): void {
        // 计算包围盒并居中
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // 缩放到合适大小
        const scale = 1.0 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);

        // 居中模型
        model.position.x = -center.x * scale;
        model.position.z = -center.z * scale;

        // 优化材质
        this.materialSystem.optimizeModelMaterials(model, this.scene.environment || undefined);
    }

    /**
     * 设置Studio灯光
     */
    private setupStudioLighting(model: THREE.Object3D): void {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        this.lightSystem.createStudioLighting({
            center,
            size,
            radius: Math.max(size.x, size.y, size.z) / 2
        });
    }

    /**
     * 更新模型状态
     */
    public async updateModel(modelId: string, state: Partial<ModelState>): Promise<void> {
        if (!this.models.has(modelId)) {
            console.warn(`Model with id '${modelId}' not found`);
            return;
        }

        // 创建事务
        const transaction = this.createTransaction(modelId, state);

        try {
            // 应用更新
            await this.applyModelUpdate(modelId, state);

            // 保存事务
            this.saveTransaction(transaction);

            // 发送事件
            this.emit('stateChange', {
                stateId: transaction.id,
                updatedModels: [modelId],
                timestamp: Date.now()
            });

        } catch (error) {
            this.handleError('state', error as Error, { modelId });
            throw error;
        }
    }

    /**
     * 应用模型更新
     */
    private async applyModelUpdate(modelId: string, state: Partial<ModelState>): Promise<void> {
        const model = this.models.get(modelId);
        if (!model) return;

        // 更新材质
        if (state.material) {
            // 首先更新材质配置
            this.materialSystem.updateMaterial(modelId, state.material);
            // 然后应用到模型
            this.materialSystem.applyMaterialUpdates(model, modelId);
        }

        // 更新变换
        if (state.transform) {
            if (state.transform.position) {
                model.position.copy(state.transform.position);
            }
            if (state.transform.rotation) {
                model.rotation.copy(state.transform.rotation);
            }
            if (state.transform.scale) {
                model.scale.copy(state.transform.scale);
            }
        }

        // 更新可见性
        if (state.visible !== undefined) {
            model.visible = state.visible;
        }

        // 更新模型状态
        this.currentState.models[modelId] = {
            ...this.currentState.models[modelId],
            ...state
        };
    }

    /**
     * 批量更新
     */
    public async batchUpdate(updates: BatchUpdate[]): Promise<void> {
        const transaction = this.createBatchTransaction(updates);

        try {
            for (const update of updates) {
                await this.applyModelUpdate(update.modelId, update.state);
            }

            this.saveTransaction(transaction);

            this.emit('stateChange', {
                stateId: transaction.id,
                updatedModels: updates.map(u => u.modelId),
                timestamp: Date.now()
            });

        } catch (error) {
            this.handleError('state', error as Error);
            throw error;
        }
    }

    /**
     * 创建事务
     */
    private createTransaction(modelId: string, state: Partial<ModelState>): StateTransaction {
        return {
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            previousState: {
                ...this.currentState,
                models: { ...this.currentState.models }
            },
            newState: {
                ...this.currentState,
                models: {
                    ...this.currentState.models,
                    [modelId]: {
                        ...this.currentState.models[modelId],
                        ...state
                    }
                }
            }
        };
    }

    /**
     * 创建批量事务
     */
    private createBatchTransaction(updates: BatchUpdate[]): StateTransaction {
        const newModels = { ...this.currentState.models };

        updates.forEach(update => {
            if (newModels[update.modelId]) {
                newModels[update.modelId] = {
                    ...newModels[update.modelId],
                    ...update.state
                };
            }
        });

        return {
            id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            previousState: { ...this.currentState },
            newState: {
                ...this.currentState,
                models: newModels
            }
        };
    }

    /**
     * 保存事务
     */
    private saveTransaction(transaction: StateTransaction): void {
        // 移除后续事务
        this.transactionHistory = this.transactionHistory.slice(0, this.currentTransactionIndex + 1);

        // 添加新事务
        this.transactionHistory.push(transaction);
        this.currentTransactionIndex++;

        // 限制历史记录数量
        if (this.transactionHistory.length > 50) {
            this.transactionHistory.shift();
            this.currentTransactionIndex--;
        }
    }

    /**
     * 撤销操作
     */
    public async undo(): Promise<void> {
        if (this.currentTransactionIndex < 0) {
            console.warn('No transaction to undo');
            return;
        }

        const transaction = this.transactionHistory[this.currentTransactionIndex];
        await this.applyState(transaction.previousState);
        this.currentTransactionIndex--;

        this.emit('undo', { transaction });
    }

    /**
     * 重做操作
     */
    public async redo(): Promise<void> {
        if (this.currentTransactionIndex >= this.transactionHistory.length - 1) {
            console.warn('No transaction to redo');
            return;
        }

        this.currentTransactionIndex++;
        const transaction = this.transactionHistory[this.currentTransactionIndex];
        await this.applyState(transaction.newState);

        this.emit('redo', { transaction });
    }

    /**
     * 应用状态
     */
    private async applyState(state: SceneState): Promise<void> {
        // 应用全局状态
        await this.applyGlobalState(state.global);

        // 应用模型状态
        for (const [modelId, modelState] of Object.entries(state.models)) {
            await this.applyModelUpdate(modelId, modelState);
        }

        this.currentState = state;
    }

    /**
     * 截图
     */
    public captureFrame(): string {
        return this.postProcessSystem.captureFrame();
    }

    /**
     * 获取性能统计
     */
    public getPerformanceStats(): PerformanceStats {
        const rendererStats = this.renderer.getPerformanceStats();

        return {
            ...rendererStats,
            // 可以添加更多统计信息
        };
    }

    /**
     * 获取当前状态
     */
    public getCurrentState(): SceneState {
        return {
            global: { ...this.currentState.global },
            models: { ...this.currentState.models }
        };
    }

    /**
     * 事件处理
     */
    public on(event: string, listener: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(listener);
    }

    public off(event: string, listener: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in event listener for '${event}':`, error);
                }
            });
        }
    }

    /**
     * 错误处理
     */
    private handleError(type: ErrorEvent['type'], error: Error, context?: any): void {
        const errorEvent: ErrorEvent = {
            type,
            message: error.message,
            stack: error.stack,
            recoverable: type !== 'render'
        };

        this.emit('error', errorEvent);
        console.error(`PBRVisualizer Error (${type}):`, error, context);
    }

    /**
     * 工具方法
     */
    private countTriangles(model: THREE.Object3D): number {
        let count = 0;
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const geometry = child.geometry;
                if (geometry.index) {
                    count += geometry.index.count / 3;
                } else {
                    count += geometry.attributes.position.count / 3;
                }
            }
        });
        return Math.floor(count);
    }

    private updatePerformanceStats(): void {
        const stats = this.getPerformanceStats();
        this.emit('performance', stats);
    }

    private onWindowResize(): void {
        this.renderer.onWindowResize();
        this.postProcessSystem.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 销毁可视化器
     */
    public dispose(): void {
        if (this.isDisposed) return;

        // 清理模型
        this.models.forEach(model => {
            this.scene.remove(model);
            this.disposeObject(model);
        });
        this.models.clear();

        // 销毁子系统
        this.debugSystem.dispose();
        this.environmentSystem.dispose();
        this.lightSystem.dispose();
        this.postProcessSystem.dispose();
        this.materialSystem.dispose();
        this.renderer.dispose();

        // 清理加载器
        this.dracoLoader.dispose();

        // 清理事件监听器
        this.eventListeners.clear();
        window.removeEventListener('resize', this.onWindowResize);

        this.isDisposed = true;
        console.log('PBRVisualizer disposed');
    }

    private disposeObject(obj: THREE.Object3D): void {
        obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material?.dispose();
                }
            }
        });
    }

    // Getters
    public get initialized(): boolean {
        return this.isInitialized;
    }

    public get disposed(): boolean {
        return this.isDisposed;
    }

    /**
     * 获取调试系统API
     * 提供完整的调试功能访问
     *
     * @example
     * // 启用调试模式
     * visualizer.debug.enable();
     *
     * // 显示灯光Helper
     * visualizer.debug.setLightHelpersEnabled(true);
     *
     * // 切换Buffer可视化模式
     * visualizer.debug.setBufferVisualizationMode(SSAOOutputMode.Depth);
     *
     * // 获取调试状态
     * const state = visualizer.debug.getState();
     */
    public get debug(): DebugSystem {
        return this.debugSystem;
    }

    // ========================
    // 状态机API
    // ========================

    /**
     * 为模型创建状态机
     *
     * @example
     * // 创建一个简单的动画切换状态机
     * const stateMachine = visualizer.createStateMachine('myModel', {
     *     id: 'animationFSM',
     *     initialState: 'idle',
     *     states: [
     *         { id: 'idle', name: '待机', animationName: 'NlaTrack' },
     *         { id: 'action', name: '动作', animationName: 'NlaTrack.001' }
     *     ],
     *     transitions: [
     *         {
     *             id: 'idle_to_action',
     *             from: 'idle',
     *             to: 'action',
     *             condition: { type: 'immediate' },
     *             effect: { type: 'fade', duration: 500, easing: 'easeOutCubic' }
     *         }
     *     ]
     * });
     *
     * stateMachine.start();
     * stateMachine.trigger('idle_to_action');
     */
    public createStateMachine(modelId: string, config: StateMachineConfig): AnimationStateMachine | null {
        const model = this.models.get(modelId);
        const animations = this.modelAnimations.get(modelId);

        if (!model) {
            console.warn(`[PBRVisualizer] Model '${modelId}' not found`);
            return null;
        }

        if (!animations || animations.length === 0) {
            console.warn(`[PBRVisualizer] Model '${modelId}' has no animations`);
            return null;
        }

        // 创建状态机
        const stateMachine = new AnimationStateMachine(config);

        // 绑定模型和动画
        stateMachine.bind(model, animations);

        // 保存状态机
        const key = `${modelId}_${config.id}`;
        this.stateMachines.set(key, stateMachine);

        console.log(`[PBRVisualizer] Created state machine '${config.id}' for model '${modelId}'`);

        return stateMachine;
    }

    /**
     * 获取模型的状态机
     */
    public getStateMachine(modelId: string, stateMachineId: string): AnimationStateMachine | null {
        const key = `${modelId}_${stateMachineId}`;
        return this.stateMachines.get(key) || null;
    }

    /**
     * 移除状态机
     */
    public removeStateMachine(modelId: string, stateMachineId: string): boolean {
        const key = `${modelId}_${stateMachineId}`;
        const stateMachine = this.stateMachines.get(key);

        if (stateMachine) {
            stateMachine.dispose();
            this.stateMachines.delete(key);
            console.log(`[PBRVisualizer] Removed state machine '${stateMachineId}' from model '${modelId}'`);
            return true;
        }

        return false;
    }

    /**
     * 获取模型的所有动画名称
     */
    public getModelAnimations(modelId: string): string[] {
        const animations = this.modelAnimations.get(modelId);
        return animations ? animations.map(clip => clip.name) : [];
    }

    /**
     * 播放模型的指定动画（不使用状态机）
     */
    public playAnimation(modelId: string, animationName: string, options?: {
        loop?: boolean;
        speed?: number;
        fadeIn?: number;
    }): boolean {
        const mixer = this.modelMixers.get(modelId);
        const animations = this.modelAnimations.get(modelId);

        if (!mixer || !animations) {
            console.warn(`[PBRVisualizer] Model '${modelId}' has no animation support`);
            return false;
        }

        const clip = animations.find(a => a.name === animationName);
        if (!clip) {
            console.warn(`[PBRVisualizer] Animation '${animationName}' not found in model '${modelId}'`);
            return false;
        }

        const action = mixer.clipAction(clip);

        // 应用选项
        if (options?.loop !== undefined) {
            action.setLoop(options.loop ? THREE.LoopRepeat : THREE.LoopOnce, options.loop ? Infinity : 1);
        }
        if (options?.speed !== undefined) {
            action.timeScale = options.speed;
        }

        // 播放动画
        action.reset();
        if (options?.fadeIn !== undefined) {
            action.fadeIn(options.fadeIn / 1000);
        }
        action.play();

        console.log(`[PBRVisualizer] Playing animation '${animationName}' on model '${modelId}'`);
        return true;
    }

    /**
     * 停止模型的所有动画
     */
    public stopAllAnimations(modelId: string): void {
        const mixer = this.modelMixers.get(modelId);
        if (mixer) {
            mixer.stopAllAction();
            console.log(`[PBRVisualizer] Stopped all animations on model '${modelId}'`);
        }
    }
}