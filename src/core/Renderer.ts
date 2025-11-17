import * as THREE from 'three';
import { 
  SceneState, 
  QualityConfig, 
  ModelState, 
  BatchUpdate, 
  TransitionOptions,
  EnvironmentConfig,
  PostProcessState,
  CameraState
} from '../types/core';
import { EnvironmentSystem } from './EnvironmentSystem';
import { PMREMGenerator } from './PMREMGenerator';
import { PostProcessor } from './PostProcessor';

export interface RendererOptions {
  container: HTMLElement;
  quality: QualityConfig;
  debug: boolean;
}

export interface RendererStats {
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  gpuMemory: number;
}

export class Renderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: any; // 使用any类型避免导入问题
  private environmentSystem: EnvironmentSystem;
  private pmremGenerator: PMREMGenerator;
  private postProcessor: PostProcessor;
  private quality: QualityConfig;
  private debug: boolean;
  private renderTarget: THREE.WebGLRenderTarget;
  private pmremRenderTarget: THREE.WebGLRenderTarget;
  private environmentMap: THREE.Texture | null = null;
  private irradianceMap: THREE.Texture | null = null;

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.quality = options.quality;
    this.debug = options.debug;

    this.initializeScene();
    this.initializeCamera();
    this.initializeRenderer();
    this.initializeSystems();
    this.setupPipeline();
  }

  async updateModel(modelId: string, state: Partial<ModelState>, options: TransitionOptions): Promise<void> {
    const object = this.scene.getObjectByName(modelId);
    if (!object) {
      console.warn(`Model ${modelId} not found in scene`);
      return;
    }

    // 应用变换
    if (state.transform) {
      this.applyTransform(object, state.transform, options);
    }

    // 应用材质
    if (state.materials) {
      await this.applyMaterials(object, state.materials, options);
    }

    // 应用可见性
    if (state.visible !== undefined) {
      object.visible = state.visible;
    }

    // 应用动画
    if (state.animations) {
      this.applyAnimations(object, state.animations);
    }
  }

  async batchUpdate(updates: BatchUpdate[], options: TransitionOptions): Promise<void> {
    const promises = updates.map(update => 
      this.updateModel(update.modelId, update.state, options)
    );
    await Promise.all(promises);
  }

  updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    this.camera.position.copy(position);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
  }

  updateEnvironment(config: EnvironmentConfig): void {
    this.environmentSystem.updateEnvironment(config);
    this.updateEnvironmentMaps();
  }

  applyState(state: SceneState): void {
    // 应用全局状态
    this.applyGlobalState(state.global);

    // 应用模型状态
    Object.entries(state.models).forEach(([modelId, modelState]) => {
      this.updateModel(modelId, modelState, { duration: 0 });
    });
  }

  setQuality(quality: Partial<QualityConfig>): void {
    this.quality = { ...this.quality, ...quality };
    this.updateRendererSettings();
    this.updatePostProcessing();
  }

  captureFrame(): string {
    this.render();
    return this.renderer.domElement.toDataURL('image/png');
  }

  getStats(): RendererStats {
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      memoryUsage: this.renderer.info.memory.geometries || 0,
      gpuMemory: this.renderer.info.programs?.length || 0
    };
  }

  handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    
    if (this.composer) {
      this.composer.setSize(width, height);
    }

    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
  }

  render(): void {
    // 四阶段渲染管线
    this.executeRenderPipeline();
  }

  dispose(): void {
    this.scene.clear();
    this.renderer.dispose();
    
    if (this.composer) {
      this.composer.dispose();
    }
    
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    
    if (this.pmremRenderTarget) {
      this.pmremRenderTarget.dispose();
    }

    this.environmentSystem.dispose();
    this.pmremGenerator.dispose();
    this.postProcessor.dispose();
  }

  addModel(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  private initializeScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0c29);
  }

  private initializeCamera(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(3, 2, 5);
  }

  private initializeRenderer(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.container.appendChild(this.renderer.domElement);
  }

  private initializeSystems(): void {
    this.environmentSystem = new EnvironmentSystem(this.quality);
    this.pmremGenerator = new PMREMGenerator(this.renderer);
    this.postProcessor = new PostProcessor(this.renderer, this.camera, this.quality);
  }

  private setupPipeline(): void {
    // 设置渲染管线
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.container.clientWidth,
      this.container.clientHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType
      }
    );

    // 简化后处理，直接渲染
    this.composer = null; // 暂时禁用后处理
  }

  private executeRenderPipeline(): void {
    // 阶段1：环境生成
    this.generateEnvironment();

    // 阶段2：PMREM预计算
    this.generatePMREM();

    // 阶段3：PBR主渲染
    this.renderScene();

    // 阶段4：后处理
    this.applyPostProcessing();
  }

  private generateEnvironment(): void {
    if (this.environmentMap && this.irradianceMap) {
      return; // 已经生成
    }

    const environmentResult = this.environmentSystem.generateEnvironment();
    this.environmentMap = environmentResult.environmentMap;
    this.irradianceMap = environmentResult.irradianceMap;

    // 应用到场景
    if (this.environmentMap) {
      this.scene.environment = this.environmentMap;
    }
  }

  private generatePMREM(): void {
    if (!this.environmentMap) return;

    const pmremResult = this.pmremGenerator.generatePMREM(this.environmentMap);
    this.irradianceMap = pmremResult.irradiance;
    
    // 更新场景环境
    if (this.irradianceMap) {
      this.scene.environment = this.irradianceMap;
    }
  }

  private renderScene(): void {
    // 更新所有材质的IBL
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => this.updateMaterialIBL(mat));
        } else {
          this.updateMaterialIBL(object.material);
        }
      }
    });

    // 渲染场景到帧缓冲
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  private applyPostProcessing(): void {
    if (this.composer) {
      this.composer.render();
    } else {
      // 直接渲染到屏幕
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
  }

  private updateEnvironmentMaps(): void {
    // 重新生成环境贴图
    this.environmentMap = null;
    this.irradianceMap = null;
    this.generateEnvironment();
  }

  private updateMaterialIBL(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      if (this.irradianceMap) {
        material.envMap = this.irradianceMap;
        material.envMapIntensity = 1.0;
        material.needsUpdate = true;
      }
    }
  }

  private applyTransform(object: THREE.Object3D, transform: ModelState['transform'], options: TransitionOptions): void {
    if (options.duration > 0) {
      // 这里可以实现平滑过渡动画
      // 目前直接应用
      object.position.copy(transform.position);
      object.rotation.copy(transform.rotation);
      object.scale.copy(transform.scale);
    } else {
      object.position.copy(transform.position);
      object.rotation.copy(transform.rotation);
      object.scale.copy(transform.scale);
    }
  }

  private async applyMaterials(object: THREE.Object3D, materials: ModelState['materials'], options: TransitionOptions): Promise<void> {
    return new Promise((resolve) => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materialName = child.userData.materialName || 'default';
          const newMaterialState = materials[materialName];
          
          if (newMaterialState) {
            this.updateMeshMaterial(child, newMaterialState, options);
          }
        }
      });
      resolve();
    });
  }

  private updateMeshMaterial(mesh: THREE.Mesh, materialState: ModelState['materials'][string], options: TransitionOptions): void {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => this.updateMaterialProperties(mat, materialState, options));
    } else {
      this.updateMaterialProperties(mesh.material, materialState, options);
    }
  }

  private updateMaterialProperties(material: THREE.Material, state: ModelState['materials'][string], options: TransitionOptions): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      if (typeof state.color === 'string') {
        material.color.setHex(parseInt(state.color.replace('#', '0x')));
      } else if (state.color instanceof THREE.Color) {
        material.color.copy(state.color);
      }

      material.roughness = state.roughness;
      material.metalness = state.metalness;

      if (state.emissive) {
        if (typeof state.emissive === 'string') {
          material.emissive.setHex(parseInt(state.emissive.replace('#', '0x')));
        } else {
          material.emissive.copy(state.emissive);
        }
        material.emissiveIntensity = state.emissiveIntensity || 1.0;
      }

      material.needsUpdate = true;
    }
  }

  private applyAnimations(object: THREE.Object3D, animations: ModelState['animations']): void {
    // 这里可以实现动画系统
    // 目前只是占位符
  }

  private applyGlobalState(globalState: SceneState['global']): void {
    // 应用相机状态
    this.updateCamera(globalState.camera.position, globalState.camera.target);

    // 应用场景设置
    this.renderer.toneMappingExposure = globalState.sceneSettings.exposure;
    this.renderer.toneMapping = globalState.sceneSettings.toneMapping;

    // 应用后处理设置
    this.postProcessor.updateSettings(globalState.postProcessing);
  }

  private updateRendererSettings(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * this.quality.resolution, 2));
    this.renderer.setSize(
      this.container.clientWidth * this.quality.resolution,
      this.container.clientHeight * this.quality.resolution
    );
  }

  private updatePostProcessing(): void {
    this.postProcessor.updateQuality(this.quality);
  }
}
