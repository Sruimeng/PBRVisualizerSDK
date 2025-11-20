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
import { RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EnvironmentSystem } from './EnvironmentSystem';
import { PMREMGenerator } from './PMREMGenerator';
import { PostProcessor } from './PostProcessor';
import { ShadowSystem } from './ShadowSystem';
import { createNoiseSphereMaterial } from '../shaders/DynamicNoiseSphere';
import { createSGBMaterial, getSamplesForRoughness, roughnessToMip } from '../shaders/SphericalGaussianBlur';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

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
  private shadowSystem: ShadowSystem;
  private quality: QualityConfig;
  private debug: boolean;
  private renderTarget: THREE.WebGLRenderTarget;
  private pmremRenderTarget: THREE.WebGLRenderTarget;
  private environmentMap: THREE.Texture | null = null;
  private irradianceMap: THREE.Texture | null = null;
  private envIntensity: number = 1.0;
  private useCustomPMREM: boolean = false;
  private sgbScene: THREE.Scene | null = null;
  private sgbMaterial: THREE.RawShaderMaterial | null = null;
  private sgbCubeCamera: THREE.CubeCamera | null = null;
  private sgbSphere: THREE.Mesh | null = null;
  private bgScene: THREE.Scene | null = null;
  private bgCamera: THREE.OrthographicCamera | null = null;
  private bgMaterial: THREE.RawShaderMaterial | null = null;
  private bgMesh: THREE.Mesh | null = null;
  private iblScene: THREE.Scene | null = null;
  private iblMaterial: THREE.RawShaderMaterial | null = null;
  private iblMesh: THREE.Mesh | null = null;
  private activeModelId: string | null = null;
  private modelBaseY: number = 0;
  private sceneStudioLights: RectAreaLight[] = [];

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.quality = options.quality;
    this.debug = options.debug;

    this.initializeScene();
    this.initializeCamera();
    this.initializeRenderer();
    this.initializeSystems();
    this.initializeBackground();
    this.setupPipeline();
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

    // 如果是当前激活的模型，更新阴影系统
    if (this.activeModelId === modelId) {
        // 重新计算包围盒以获取正确的落地高度
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        // 假设模型缩放已经应用
        // 这里可能需要更复杂的逻辑来确定 modelBaseY，暂时简化
        // 在 ai_studio_code.html 中，modelBaseY 是在加载时计算的
    }
  }

  setShadowTarget(modelId: string): void {
    const object = this.scene.getObjectByName(modelId);
    if (object) {
        this.activeModelId = modelId;
        const box = new THREE.Box3().setFromObject(object);
        // 计算落地位置 (假设模型原点在中心或底部，这里参考 ai_studio_code.html 的逻辑)
        // ai_studio_code.html: modelBaseY = -box.min.y * scale;
        // 这里我们假设 object 已经是缩放后的
        this.modelBaseY = object.position.y; // 初始高度作为基准？
        // 或者我们需要计算包围盒的底部
        this.modelBaseY = box.min.y;
        
        // 更新阴影基础大小
        const size = box.getSize(new THREE.Vector3());
        const shadowScale = Math.max(size.x, size.z) * 1.5;
        this.shadowSystem.setBaseScale(shadowScale);
        this.shadowSystem.setVisible(true);
    } else {
        this.activeModelId = null;
        this.shadowSystem.setVisible(false);
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
    this.useCustomPMREM = !!config.useCustomPMREM;
    if (config.type === 'studio') {
      RectAreaLightUniformsLib.init();
      this.clearStudioLights();
      const key = config.studio?.keyLight || { color: 0xffffff, intensity: 3.0, position: new THREE.Vector3(3, 4, 3) } as any;
      const rim = config.studio?.rimLight || { color: 0x4c8bf5, intensity: 5.0, position: new THREE.Vector3(-3, 2, -4) } as any;
      const fill = config.studio?.fillLight || { color: 0xffeedd, intensity: 1.5, position: new THREE.Vector3(-4, 0, 4) } as any;
      const keyLight = new RectAreaLight(key.color as any, key.intensity, 4, 4);
      keyLight.position.copy(key.position);
      keyLight.lookAt(0, 0, 0);
      this.scene.add(keyLight);
      this.sceneStudioLights.push(keyLight);
      const rimLight = new RectAreaLight(rim.color as any, rim.intensity, 3, 3);
      rimLight.position.copy(rim.position);
      rimLight.lookAt(0, 1, 0);
      this.scene.add(rimLight);
      this.sceneStudioLights.push(rimLight);
      const fillLight = new RectAreaLight(fill.color as any, fill.intensity, 5, 5);
      fillLight.position.copy(fill.position);
      fillLight.lookAt(0, 0, 0);
      this.scene.add(fillLight);
      this.sceneStudioLights.push(fillLight);
    } else {
      this.clearStudioLights();
    }
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
    this.updateShadows();
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
    this.shadowSystem.dispose();
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
      antialias: false, // 依赖后处理或高分屏，参考 ai_studio_code.html
      alpha: true,
      stencil: true,
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
    this.shadowSystem = new ShadowSystem(this.scene);
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

    // 初始化后处理
    this.composer = new EffectComposer(this.renderer, this.renderTarget);
    if (this.bgScene && this.bgCamera) {
      const bgPass = new RenderPass(this.bgScene, this.bgCamera);
      this.composer.addPass(bgPass);
    }
    
    // 1. Render Pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // 2. SSAO Pass
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const ssaoPass = new SSAOPass(this.scene, this.camera, width, height);
    ssaoPass.kernelRadius = 4;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    ssaoPass.enabled = false; // 默认关闭，由 PostProcessor 控制
    this.composer.addPass(ssaoPass);
    
    // 3. Output Pass (ToneMapping)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
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
    this.bgScene.add(this.bgMesh);
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
    const envType = this.environmentSystem.getCurrentType();

    if (envType === 'noise-sphere' && this.bgScene && this.bgMaterial && this.bgCamera) {
      const drawSize = new THREE.Vector2();
      this.renderer.getDrawingBufferSize(drawSize);
      this.bgMaterial.uniforms.uResolution.value.copy(drawSize);
      this.bgMaterial.uniforms.uTime.value = performance.now() * 0.001;

      if (this.useCustomPMREM) {
        const bgRT = new THREE.WebGLRenderTarget(drawSize.x, drawSize.y, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.HalfFloatType
        });
        this.renderer.setRenderTarget(bgRT);
        this.renderer.render(this.bgScene, this.bgCamera);
        this.renderer.setRenderTarget(null);

        if (!this.sgbScene) this.sgbScene = new THREE.Scene();
        if (!this.sgbMaterial) {
          this.sgbMaterial = createSGBMaterial(bgRT.texture, {
            samples: getSamplesForRoughness(0.5),
            latitudinal: true,
            dTheta: 0.02,
            mipInt: roughnessToMip(0.5),
            poleAxis: new THREE.Vector3(0, 1, 0)
          });
        } else {
          (this.sgbMaterial.uniforms as any).envMap.value = bgRT.texture;
        }
        if (!this.sgbSphere) {
          this.sgbSphere = new THREE.Mesh(new THREE.SphereGeometry(50, 64, 64), this.sgbMaterial);
          this.sgbSphere.frustumCulled = false;
          this.sgbScene.add(this.sgbSphere);
        }
        if (!this.sgbCubeCamera) {
          const size = Math.max(256, Math.floor(512 * this.quality.resolution));
          const cubeRT = new THREE.WebGLCubeRenderTarget(size, { format: THREE.RGBAFormat, type: THREE.HalfFloatType });
          this.sgbCubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRT);
        }
        this.sgbCubeCamera.update(this.renderer, this.sgbScene);
        this.environmentMap = this.sgbCubeCamera.renderTarget.texture as unknown as THREE.Texture;
        this.irradianceMap = this.environmentMap;
        this.scene.environment = this.irradianceMap as THREE.Texture;
        return;
      } else {
        const pmremFromScene = this.pmremGenerator.generateFromScene(this.bgScene);
        this.environmentMap = pmremFromScene.envMap;
        this.irradianceMap = pmremFromScene.irradiance;
        if (this.irradianceMap) {
          this.scene.environment = this.irradianceMap;
        }
        return;
      }
    }

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
        this.bgMaterial.uniforms.uTime.value = performance.now() * 0.001;
        this.renderer.render(this.bgScene, this.bgCamera);
      }
      this.renderer.render(this.scene, this.camera);
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
  private updateShadows(): void {
    if (this.activeModelId) {
        const object = this.scene.getObjectByName(this.activeModelId);
        if (object) {
            this.shadowSystem.update(object, this.modelBaseY);
        }
    }
  }
  private clearStudioLights(): void {
    this.sceneStudioLights.forEach(l => { this.scene.remove(l); l.dispose(); });
    this.sceneStudioLights = [];
  }
}
