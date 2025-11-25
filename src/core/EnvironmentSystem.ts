import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EnvironmentConfig } from '../types';

/**
 * 环境映射系统
 *
 * 负责：
 * - HDR/EXR环境贴图加载
 * - PMREM预过滤计算
 * - IBL照明设置
 * - 动态环境更新
 * - 环境贴图缓存管理
 */
export class EnvironmentSystem {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private pmremGenerator: THREE.PMREMGenerator | null = null;
    private environmentTexture: THREE.Texture | null = null;
    private environmentRT: THREE.WebGLRenderTarget | null = null;
    private currentConfig: EnvironmentConfig | null = null;

    // 性能优化标志（避免重复PMREM处理）
    private environmentGenerated = false;
    private isLoading = false;

    // 环境贴图缓存
    private textureCache = new Map<string, THREE.Texture>();

    constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        this.renderer = renderer;
        this.scene = scene;
        this.initializePMREM();
    }

    /**
     * 初始化PMREM生成器
     */
    private initializePMREM(): void {
        if (!this.pmremGenerator) {
            this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            this.pmremGenerator.compileEquirectangularShader();
        }
    }

    /**
     * 设置环境配置
     */
    public async setEnvironment(config: EnvironmentConfig): Promise<void> {
        // 检查是否是相同的配置
        if (this.isSameConfig(config)) {
            return;
        }

        this.currentConfig = { ...config };

        try {
            await this.loadEnvironmentTexture(config);
        } catch (error) {
            console.error('Failed to set environment:', error);
            throw error;
        }
    }

    /**
     * 检查是否是相同的配置
     */
    private isSameConfig(config: EnvironmentConfig): boolean {
        if (!this.currentConfig) return false;

        return this.currentConfig.url === config.url &&
               this.currentConfig.intensity === config.intensity;
    }

    /**
     * 加载环境贴图
     */
    private async loadEnvironmentTexture(config: EnvironmentConfig): Promise<void> {
        if (this.isLoading) return;

        // 检查缓存
        const cacheKey = this.getCacheKey(config);
        if (this.textureCache.has(cacheKey)) {
            this.applyEnvironmentTexture(this.textureCache.get(cacheKey)!);
            return;
        }

        this.isLoading = true;

        try {
            const loader = new HDRLoader();

            // 加载HDR环境贴图
            const texture = await new Promise<THREE.Texture>((resolve, reject) => {
                loader.load(
                    config.url,
                    (loadedTexture: THREE.Texture) => resolve(loadedTexture),
                    undefined,
                    reject
                );
            });

            // 设置贴图映射方式
            texture.mapping = THREE.EquirectangularReflectionMapping;

            // 缓存贴图
            this.textureCache.set(cacheKey, texture);

            // 应用环境贴图
            this.applyEnvironmentTexture(texture);

        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 获取缓存键
     */
    private getCacheKey(config: EnvironmentConfig): string {
        return `${config.url}_${config.intensity || 1.0}`;
    }

    /**
     * 应用环境贴图到场景
     */
    private applyEnvironmentTexture(texture: THREE.Texture): void {
        // 性能优化：避免重复PMREM处理
        if (this.environmentGenerated && this.environmentTexture === texture) {
            this.scene.environmentIntensity = this.currentConfig?.intensity || 1.0;
            return;
        }

        // 清理之前的PMREM纹理
        this.cleanupPMREM();

        // 生成PMREM预过滤环境贴图
        if (this.pmremGenerator) {
            const renderTarget = this.pmremGenerator.fromEquirectangular(texture);

            // 应用到场景
            this.scene.environment = renderTarget.texture;
            this.scene.environmentIntensity = this.currentConfig?.intensity || 1.0;

            // 保存引用用于后续清理
            this.environmentTexture = renderTarget.texture;
            this.environmentRT = renderTarget;

            // 标记环境已生成
            this.environmentGenerated = true;

            console.log('Environment texture generated and applied');
        }
    }

    /**
     * 更新环境强度
     */
    public updateIntensity(intensity: number): void {
        this.scene.environmentIntensity = intensity;

        if (this.currentConfig) {
            this.currentConfig.intensity = intensity;
        }
    }

    /**
     * 移除环境贴图
     */
    public removeEnvironment(): void {
        this.cleanupPMREM();
        this.environmentTexture = null;
        this.scene.environment = null;
        this.scene.background = new THREE.Color(0x000000);
        this.environmentGenerated = false;

        if (this.currentConfig) {
            this.currentConfig.url = '';
        }
    }

    /**
     * 清理PMREM资源
     */
    private cleanupPMREM(): void {
        if (this.environmentRT) {
            this.environmentRT.dispose();
            this.environmentRT = null;
        }
    }

    /**
     * 获取当前环境配置
     */
    public getCurrentConfig(): EnvironmentConfig | null {
        return this.currentConfig ? { ...this.currentConfig } : null;
    }

    /**
     * 检查是否正在加载
     */
    public get loading(): boolean {
        return this.isLoading;
    }

    /**
     * 检查环境是否已生成
     */
    public get isEnvironmentGenerated(): boolean {
        return this.environmentGenerated;
    }

    /**
     * 获取环境贴图信息
     */
    public getEnvironmentInfo(): {
        hasEnvironment: boolean;
        hasTexture: boolean;
        intensity: number;
        textureSize?: { width: number; height: number };
    } {
        return {
            hasEnvironment: !!this.scene.environment,
            hasTexture: !!this.environmentTexture,
            intensity: this.scene.environmentIntensity,
            textureSize: this.environmentTexture ? {
                width: (this.environmentTexture as any).source?.data?.width || 0,
                height: (this.environmentTexture as any).source?.data?.height || 0
            } : undefined
        };
    }

    /**
     * 清理缓存
     */
    public clearCache(): void {
        // 清理缓存的纹理
        this.textureCache.forEach(texture => {
            texture.dispose();
        });
        this.textureCache.clear();
    }

    /**
     * 销毁环境系统
     */
    public dispose(): void {
        this.cleanupPMREM();
        this.clearCache();

        if (this.pmremGenerator) {
            this.pmremGenerator.dispose();
            this.pmremGenerator = null;
        }

        this.environmentTexture = null;
        this.currentConfig = null;
        this.environmentGenerated = false;

        console.log('EnvironmentSystem disposed');
    }
}
