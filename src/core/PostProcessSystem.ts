import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { PostProcessState, SSAOConfig, BloomConfig, ToneMappingConfig, AntialiasingConfig } from '../types';

/**
 * 后处理系统
 *
 * 负责：
 * - 效果合成器管理
 * - SSAO接触阴影
 * - Bloom泛光效果
 * - 抗锯齿处理
 * - 色调映射优化
 * - 性能监控
 */
export class PostProcessSystem {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;

    private composer: EffectComposer;
    private renderPass: RenderPass;
    private outputPass: OutputPass;

    // 后处理效果
    private ssaoPass: SSAOPass | null = null;
    private bloomPass: any = null; // Bloom UnrealBloomPass 需要额外导入

    // 当前配置
    private currentConfig: PostProcessState;
    private isEnabled = false;

    // 性能监控
    private lastRenderTime = 0;

    constructor(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        width: number,
        height: number
    ) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // 初始化合成器
        this.composer = new EffectComposer(renderer);
        this.renderPass = new RenderPass(scene, camera);
        this.outputPass = new OutputPass();
        // 默认配置
        this.currentConfig = this.getDefaultConfig();

        this.setupComposer(width, height);

        

        console.log('PostProcessSystem initialized');
    }

    /**
     * 获取默认后处理配置
     */
    private getDefaultConfig(): PostProcessState {
        return {
            enabled: true,
            toneMapping: {
                type: THREE.ACESFilmicToneMapping,
                exposure: 1.0,
                whitePoint: 1.0
            },
            bloom: {
                enabled: false, // 默认关闭，性能考虑
                strength: 0.5,
                radius: 0.4,
                threshold: 0.8
            },
            ssao: {
                enabled: true, // 默认开启，提升立体感
                kernelRadius: 4,
                minDistance: 0.005,
                maxDistance: 0.1
            },
            antialiasing: {
                type: 'fxaa',
                enabled: true
            }
        };
    }

    /**
     * 设置合成器
     */
    private setupComposer(width: number, height: number): void {
        this.composer.setSize(width, height);

        // 添加基础渲染通道
        this.composer.addPass(this.renderPass);

        // 添加SSAO通道
        this.ssaoPass = new SSAOPass(this.scene, this.camera, width, height);
        this.applySSAOConfig(this.currentConfig.ssao);
        this.composer.addPass(this.ssaoPass);

        // 添加输出通道
        this.composer.addPass(this.outputPass);
    }

    /**
     * 设置后处理配置
     */
    public setConfig(config: Partial<PostProcessState>): void {
        const newConfig = { ...this.currentConfig, ...config };
        this.currentConfig = newConfig;

        // 应用配置
        if (config.enabled !== undefined) {
            this.setEnabled(config.enabled);
        }

        if (config.ssao) {
            this.applySSAOConfig(config.ssao);
        }

        if (config.bloom) {
            this.applyBloomConfig(config.bloom);
        }

        if (config.toneMapping) {
            this.applyToneMappingConfig(config.toneMapping);
        }

        if (config.antialiasing) {
            this.applyAntialiasingConfig(config.antialiasing);
        }
    }

    /**
     * 启用/禁用后处理
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.currentConfig.enabled = enabled;

        // 控制SSAO通道
        if (this.ssaoPass) {
            this.ssaoPass.enabled = enabled && this.currentConfig.ssao.enabled;
        }

        // 控制Bloom通道
        if (this.bloomPass) {
            this.bloomPass.enabled = enabled && this.currentConfig.bloom.enabled;
        }
    }

    /**
     * 应用SSAO配置
     */
    private applySSAOConfig(config: SSAOConfig): void {
        if (!this.ssaoPass) return;

        this.ssaoPass.enabled = this.isEnabled && config.enabled;
        this.ssaoPass.kernelRadius = config.kernelRadius;
        this.ssaoPass.minDistance = config.minDistance;
        this.ssaoPass.maxDistance = config.maxDistance;
    }

    /**
     * 应用Bloom配置
     */
    private applyBloomConfig(config: BloomConfig): void {
        // 注意：这里需要导入 UnrealBloomPass
        // 为了简化，暂时作为占位符
        if (this.bloomPass) {
            this.bloomPass.enabled = this.isEnabled && config.enabled;
            // this.bloomPass.strength = config.strength;
            // this.bloomPass.radius = config.radius;
            // this.bloomPass.threshold = config.threshold;
        }
    }

    /**
     * 应用色调映射配置
     */
    private applyToneMappingConfig(config: ToneMappingConfig): void {
        // 色调映射主要在渲染器层面处理
        this.renderer.toneMapping = config.type;
        this.renderer.toneMappingExposure = config.exposure;
    }

    /**
     * 应用抗锯齿配置
     */
    private applyAntialiasingConfig(config: AntialiasingConfig): void {
        // 抗锯齿配置主要在渲染器初始化时设置
        // 这里可以动态切换不同类型的抗锯齿
        console.log(`Antialiasing type: ${config.type}, enabled: ${config.enabled}`);
    }

    /**
     * 渲染后处理
     */
    public render(): void {
        if (!this.isEnabled) {
            // 如果后处理被禁用，直接渲染原始场景
            this.renderer.render(this.scene, this.camera);
            return;
        }

        const startTime = performance.now();

        // 执行后处理渲染
        this.composer.render();

        this.lastRenderTime = performance.now() - startTime;
    }

    /**
     * 调整画布尺寸
     */
    public setSize(width: number, height: number): void {
        this.composer.setSize(width, height);

        if (this.ssaoPass) {
            this.ssaoPass.setSize(width, height);
        }
    }

    /**
     * 设置像素比
     */
    public setPixelRatio(pixelRatio: number): void {
        this.composer.setPixelRatio(pixelRatio);
    }

    /**
     * 切换SSAO开关
     */
    public toggleSSAO(enabled?: boolean): void {
        const ssaoEnabled = enabled ?? !this.currentConfig.ssao.enabled;
        this.currentConfig.ssao.enabled = ssaoEnabled;
        this.applySSAOConfig(this.currentConfig.ssao);
    }

    /**
     * 切换Bloom开关
     */
    public toggleBloom(enabled?: boolean): void {
        const bloomEnabled = enabled ?? !this.currentConfig.bloom.enabled;
        this.currentConfig.bloom.enabled = bloomEnabled;
        this.applyBloomConfig(this.currentConfig.bloom);
    }

    /**
     * 调整SSAO强度
     */
    public adjustSSAOStrength(multiplier: number): void {
        if (!this.ssaoPass) return;

        this.ssaoPass.kernelRadius *= multiplier;
        this.ssaoPass.maxDistance *= multiplier;

        // 更新配置
        this.currentConfig.ssao.kernelRadius = this.ssaoPass.kernelRadius;
        this.currentConfig.ssao.maxDistance = this.ssaoPass.maxDistance;
    }

    /**
     * 获取当前配置
     */
    public getCurrentConfig(): PostProcessState {
        return { ...this.currentConfig };
    }

    /**
     * 获取性能信息
     */
    public getPerformanceInfo(): {
        renderTime: number;
        passCount: number;
        enabled: boolean;
    } {
        return {
            renderTime: this.lastRenderTime,
            passCount: this.composer.passes.length,
            enabled: this.isEnabled
        };
    }

    /**
     * 截图（包含后处理效果）
     */
    public captureFrame(format: 'png' | 'jpeg' = 'png', quality = 0.9): string {
        return this.composer.renderer.domElement.toDataURL(`image/${format}`, quality);
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        if (this.composer) {
            this.composer.dispose();
        }

        if (this.ssaoPass) {
            this.ssaoPass.dispose();
        }

        if (this.bloomPass) {
            this.bloomPass.dispose();
        }

        console.log('PostProcessSystem disposed');
    }
}
