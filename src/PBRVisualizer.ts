import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import {
    GlobalState,
    ModelState,
    SceneState,
    VisualizerOptions,
    BatchUpdate,
    TransitionOptions,
    StateTransaction,
    PerformanceStats,
    ErrorEvent,
    ModelLoadedEvent,
    StateChangeEvent
} from './types';

import { Renderer } from './core/Renderer';
import { EnvironmentSystem } from './core/EnvironmentSystem';
import { LightSystem } from './core/LightSystem';
import { PostProcessSystem } from './core/PostProcessSystem';
import { MaterialSystem } from './core/MaterialSystem';

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
    private renderer: Renderer;
    private environmentSystem: EnvironmentSystem;
    private lightSystem: LightSystem;
    private postProcessSystem: PostProcessSystem;
    private materialSystem: MaterialSystem;

    // 场景组件
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;

    // 状态管理
    private currentState: SceneState;
    private transactionHistory: StateTransaction[] = [];
    private currentTransactionIndex = -1;

    // 模型管理
    private models = new Map<string, THREE.Object3D>();
    private gltfLoader: GLTFLoader;
    private dracoLoader: DRACOLoader;

    // 事件系统
    private eventListeners = new Map<string, Function[]>();

    // 状态标志
    private isInitialized = false;
    private isDisposed = false;

    constructor(options: VisualizerOptions) {
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

        // 合并用户配置
        this.currentState = {
            global: { ...defaultGlobalState, ...options.initialGlobalState },
            models: {}
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

        // 设置轨道控制器
        this.controls = new OrbitControls(this.camera, this.renderer.canvas);
    }

    /**
     * 设置加载器
     */
    private setupLoader(): void {
        this.gltfLoader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
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
            // 初始化渲染器
            await this.renderer.initialize();

            // 应用全局状态
            await this.applyGlobalState(this.currentState.global);

            // 设置轨道控制器
            this.setupControls();

            // 开始渲染循环
            this.startRenderLoop();

            this.isInitialized = true;
            this.emit('initialized');

            console.log('PBRVisualizer initialized successfully');
        } catch (error) {
            this.handleError('init', error as Error);
            throw error;
        }
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
        const animate = () => {
            if (this.isDisposed) return;

            requestAnimationFrame(animate);

            // 更新控制器
            this.controls.update();

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
            this.processModel(model, initialState);

            // 添加到场景
            this.scene.add(model);
            this.models.set(id, model);

            // 创建模型状态
            this.currentState.models[id] = {
                animations: [],
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
    private processModel(model: THREE.Object3D, initialState?: Partial<ModelState>): void {
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
        this.materialSystem.optimizeModelMaterials(model, this.scene.environment);
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
        const postProcessStats = this.postProcessSystem.getPerformanceInfo();

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
            recoverable: type !== 'init'
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
}