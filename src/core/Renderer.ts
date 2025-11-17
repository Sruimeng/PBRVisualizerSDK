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
import { createNoiseSphereMaterial } from '../shaders/DynamicNoiseSphere';

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
  private envIntensity: number = 1.0;
  private bgScene: THREE.Scene | null = null;
  private bgCamera: THREE.OrthographicCamera | null = null;
  private bgMaterial: THREE.RawShaderMaterial | null = null;
  private bgMesh: THREE.Mesh | null = null;
  private iblScene: THREE.Scene | null = null;
  private iblMaterial: THREE.RawShaderMaterial | null = null;
  private iblMesh: THREE.Mesh | null = null;

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.quality = options.quality;
    this.debug = options.debug;

    this.initializeScene();
    this.initializeCamera();
    this.initializeRenderer();
    this.initializeSystems();
    this.setupPipeline();
    this.initializeBackground();
    this.initializeIBLSphere();
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
    this.envIntensity = config.intensity ?? (config.hdr?.intensity ?? 1.0);
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
    this.renderer.autoClear = false;

    this.container.appendChild(this.renderer.domElement);
  }

  private initializeSystems(): void {
    this.environmentSystem = new EnvironmentSystem(this.quality, this.renderer);
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

  private initializeBackground(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.bgScene = new THREE.Scene();
    this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgMaterial = createNoiseSphereMaterial({
      uResolution: new THREE.Vector2(width, height),
      uTime: 0,
      uSmooth: 0.15,
      uRadius: 0.75,
      uNoise: 0.12,
      uBgColor1: new THREE.Color(0x0a0e2a),
      uBgColor2: new THREE.Color(0x4a6fa5)
    });
    const plane = new THREE.PlaneGeometry(2, 2);
    this.bgMesh = new THREE.Mesh(plane, this.bgMaterial);
    this.bgMesh.frustumCulled = false;
    this.scene.add(this.bgMesh);
  }

  private initializeIBLSphere(): void {
    this.iblScene = new THREE.Scene();
    const vtx = `
precision highp float;
attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform vec3 uCamPos;
varying vec3 vDir;
void main(){
  vec4 wp = modelMatrix * vec4(position,1.0);
  vDir = normalize(wp.xyz - uCamPos);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;
    const fsh = `
precision highp float;
varying vec3 vDir;
uniform float uTime;
uniform float uSmooth;
uniform float uRadius;
uniform float uNoise;
uniform vec3 uBgColor1;
uniform vec3 uBgColor2;
uniform vec3 uAxis;
uniform float uVignette;
uniform float uBright;
const float PI = 3.141592653589793;
const float RECIPROCAL_PI = 0.3183098861837907;
const float RECIPROCAL_PI2 = 0.15915494309189535;
float hash12(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec3 dir = normalize(vDir);
  float ang = acos(clamp(dot(dir, normalize(uAxis)), -1.0, 1.0));
  float dist = ang / PI;
  float ring = smoothstep(uRadius, uRadius - uSmooth, dist);
  float vig = smoothstep(uVignette, 1.0, dist);
  vec3 outgo = mix(uBgColor1, uBgColor2, ring);
  outgo += vec3(uBright * (1.0 - vig));
  float u = atan(dir.z, dir.x) * RECIPROCAL_PI2 + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) * RECIPROCAL_PI + 0.5;
  float noise = hash12(vec2(u,v) * 3.152 + vec2(uTime*0.2, uTime*0.14));
  outgo += vec3((noise - 0.5) * uNoise * max(ring, 0.0));
  gl_FragColor = vec4(outgo, 1.0);
}`;
    this.iblMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        uCamPos: { value: new THREE.Vector3(0,0,0) },
        uTime: { value: 0 },
        uSmooth: { value: 0.15 },
        uRadius: { value: 0.75 },
        uNoise: { value: 0.08 },
        uBgColor1: { value: new THREE.Color(0x0f0c29) },
        uBgColor2: { value: new THREE.Color(0x4a6fa5) },
        uAxis: { value: new THREE.Vector3(0,0,1) },
        uVignette: { value: 0.85 },
        uBright: { value: 0.10 }
      },
      vertexShader: vtx,
      fragmentShader: fsh,
      depthWrite: false,
      depthTest: false,
      side: THREE.BackSide
    });
    const sphere = new THREE.SphereGeometry(50, 64, 64);
    this.iblMesh = new THREE.Mesh(sphere, this.iblMaterial);
    this.iblMesh.frustumCulled = false;
    this.iblScene.add(this.iblMesh);
  }

  private executeRenderPipeline(): void {
    // 阶段1：环境生成 + 单次PMREM
    this.generateEnvironment();

    // 阶段2：PBR主渲染
    this.renderScene();

    // 阶段3：后处理
    this.applyPostProcessing();
  }

  private generateEnvironment(): void {
    // 统一从 EnvironmentSystem 获取源环境贴图，再执行一次 PMREM
    const maps = this.environmentSystem.generateEnvironment();
    this.environmentMap = maps.environmentMap;

    if (this.environmentMap) {
      const pmrem = this.pmremGenerator.generatePMREM(this.environmentMap);
      this.irradianceMap = pmrem.irradiance;
      if (this.irradianceMap) {
        this.scene.environment = this.irradianceMap;
      }
    }
  }

  private generatePMREM(): void {
    // 移除重复的 PMREM 执行，逻辑合并到 generateEnvironment()
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
      if (this.bgScene && this.bgCamera && this.bgMaterial) {
        const drawSize = new THREE.Vector2();
        this.renderer.getDrawingBufferSize(drawSize);
        this.bgMaterial.uniforms.uResolution.value.copy(drawSize);
        this.bgMaterial.uniforms.uTime.value = performance.now() * 0.000001;
        this.renderer.render(this.bgScene, this.bgCamera);
      }
      // this.renderer.render(this.scene, this.camera);
    }
  }

  private updateEnvironmentMaps(): void {
    // 重新生成环境贴图
    this.environmentMap = null;
    this.irradianceMap = null;
    this.generateEnvironment();
  }

  updateBackgroundSettings(settings: Partial<{ radius: number; smooth: number; noise: number }>): void {
    if (this.bgMaterial) {
      if (settings.radius !== undefined) this.bgMaterial.uniforms.uRadius.value = settings.radius;
      if (settings.smooth !== undefined) this.bgMaterial.uniforms.uSmooth.value = settings.smooth;
      if (settings.noise !== undefined) this.bgMaterial.uniforms.uNoise.value = settings.noise;
    }
    this.updateEnvironmentMaps();
  }

  private updateMaterialIBL(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      if (this.irradianceMap) {
        material.envMap = this.irradianceMap;
        material.envMapIntensity = this.envIntensity;
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
          const newMaterialState = materials[materialName] ?? materials['default'];
          
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

      if (typeof state.envMapIntensity === 'number') {
        material.envMapIntensity = state.envMapIntensity;
      }

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
