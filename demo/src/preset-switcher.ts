import { PBRVisualizer, GlobalState, MaterialState } from '@sruim/pbr-visualizer-sdk';
import { Vector3, Color } from 'three';

/**
 * 预设加载器 - 加载和缓存预设文件
 */
export class PresetLoader {
  private cache: Map<string, any> = new Map();
  private baseUrl: string = '/demo/assets/presets';

  /**
   * 加载场景预设
   */
  async loadScene(sceneName: string): Promise<any> {
    const cacheKey = `scene:${sceneName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/scenes/${sceneName}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load scene preset: ${sceneName}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * 加载材质库
   */
  async loadMaterialLibrary(libraryName: string): Promise<any> {
    const cacheKey = `materials:${libraryName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/materials/${libraryName}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load material library: ${libraryName}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * 加载预设目录
   */
  async loadCatalog(): Promise<any> {
    const cacheKey = 'catalog';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${this.baseUrl}/catalog.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to load preset catalog');
    }

    const data = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 预设切换演示 - 主要演示类
 */
export class PresetSwitcherDemo {
  private visualizer: PBRVisualizer | null = null;
  private presetLoader: PresetLoader = new PresetLoader();
  private currentModelId: string = 'main_model';
  private currentScene: string = 'product-showcase';
  private currentMaterialLibrary: string = 'metals';
  private currentMaterial: string = 'polished-steel';
  private catalog: any = null;

  constructor() {
    this.init();
  }

  /**
   * 初始化演示
   */
  private async init(): Promise<void> {
    try {
      // 加载预设目录
      this.catalog = await this.presetLoader.loadCatalog();

      // 创建PBRVisualizer实例
      const container = document.getElementById('app');
      if (!container) {
        throw new Error('Container element not found');
      }

      this.visualizer = new PBRVisualizer({
        container,
        models: [
          {
            id: this.currentModelId,
            url: '/demo/glb/test.glb',
            visible: true,
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        ],
        globalState: {
          background: { type: 'color', color: '#f0f0f0' },
          environment: {
            url: '/demo/hdr/env.hdr',
            intensity: 1.2,
          },
        },
        debug: false,
      });

      // 加载初始场景预设
      await this.switchScene(this.currentScene);

      // 绑定全局函数
      this.bindGlobalFunctions();

      console.log('PresetSwitcherDemo initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PresetSwitcherDemo:', error);
    }
  }

  /**
   * 切换场景预设
   */
  async switchScene(sceneName: string): Promise<void> {
    if (!this.visualizer) return;

    try {
      console.log(`Switching to scene: ${sceneName}`);

      const scenePreset = await this.presetLoader.loadScene(sceneName);
      this.currentScene = sceneName;

      // 应用环境配置
      if (scenePreset.environment) {
        this.visualizer.updateEnvironment(scenePreset.environment);
      }

      // 应用后处理配置
      if (scenePreset.postProcessing) {
        this.visualizer.updatePostProcessing(scenePreset.postProcessing);
      }

      // 应用相机配置
      if (scenePreset.camera) {
        const { position, target, controls, fov } = scenePreset.camera;
        if (position) {
          this.visualizer.setCamera({
            position: new Vector3(position.x, position.y, position.z),
            lookAtPosition: target ? new Vector3(target.x, target.y, target.z) : undefined,
            fov: fov,
          });
        }
        if (controls) {
          this.visualizer.setControls(controls);
        }
      }

      // 应用暗角配置
      if (scenePreset.vignette) {
        this.visualizer.setModelVignette(this.currentModelId, scenePreset.vignette);
      }

      // 应用默认材质
      if (scenePreset.defaultMaterial) {
        this.visualizer.updateModel(this.currentModelId, {
          material: scenePreset.defaultMaterial,
        });
      }

      // 更新UI
      this.updateUI();

      console.log('Scene switched successfully');
    } catch (error) {
      console.error('Failed to switch scene:', error);
    }
  }

  /**
   * 切换材质库
   */
  async switchMaterialLibrary(libraryName: string): Promise<void> {
    if (!this.visualizer) return;

    try {
      console.log(`Switching to material library: ${libraryName}`);

      const library = await this.presetLoader.loadMaterialLibrary(libraryName);
      this.currentMaterialLibrary = libraryName;

      // 更新UI - 材质选择下拉框
      const materialSelect = document.getElementById('material-select') as HTMLSelectElement;
      if (materialSelect && library.presets) {
        materialSelect.innerHTML = '';
        library.presets.forEach((preset: any) => {
          const option = document.createElement('option');
          option.value = preset.id;
          option.text = preset.name;
          materialSelect.appendChild(option);
        });

        // 切换到第一个材质
        if (library.presets.length > 0) {
          await this.switchMaterial(library.presets[0].id);
        }
      }

      console.log('Material library switched successfully');
    } catch (error) {
      console.error('Failed to switch material library:', error);
    }
  }

  /**
   * 切换材质
   */
  async switchMaterial(materialId: string): Promise<void> {
    if (!this.visualizer) return;

    try {
      console.log(`Switching to material: ${materialId}`);

      const library = await this.presetLoader.loadMaterialLibrary(this.currentMaterialLibrary);
      const material = library.presets?.find((m: any) => m.id === materialId);

      if (!material || !material.material) {
        throw new Error(`Material not found: ${materialId}`);
      }

      this.currentMaterial = materialId;

      // 应用材质配置
      const materialConfig = {
        ...material.material,
        // 确保颜色是Color对象
        color: material.material.color ? new Color(material.material.color) : undefined,
      };

      this.visualizer.updateModel(this.currentModelId, {
        material: materialConfig,
      });

      // 更新UI
      this.updateUI();

      console.log('Material switched successfully');
    } catch (error) {
      console.error('Failed to switch material:', error);
    }
  }

  /**
   * 切换模型
   */
  async switchModel(modelUrl: string): Promise<void> {
    if (!this.visualizer) return;

    try {
      console.log(`Switching to model: ${modelUrl}`);

      // 移除旧模型
      this.visualizer.removeModel(this.currentModelId);

      // 加载新模型
      const modelId = `model_${Date.now()}`;
      await this.visualizer.loadModel(modelUrl, modelId);

      // 更新模型ID
      this.currentModelId = modelId;

      // 重新应用当前场景和材质
      await this.switchScene(this.currentScene);
      await this.switchMaterial(this.currentMaterial);

      console.log('Model switched successfully');
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  }

  /**
   * 更新UI显示
   */
  private updateUI(): void {
    // 更新场景信息
    const sceneInfo = this.catalog.scenes.find((s: any) => s.id === this.currentScene);
    if (sceneInfo) {
      const sceneNameEl = document.getElementById('scene-name');
      const sceneDescEl = document.getElementById('scene-description');
      if (sceneNameEl) sceneNameEl.textContent = sceneInfo.name;
      if (sceneDescEl) sceneDescEl.textContent = sceneInfo.description;
    }

    // 更新材质信息
    const libraryInfo = this.catalog.materials.find((m: any) => m.id === this.currentMaterialLibrary);
    const materialPresets = libraryInfo?.samples || [];
    const currentMaterialInfo = materialPresets.find((m: any) => m.id === this.currentMaterial);

    if (currentMaterialInfo) {
      const materialNameEl = document.getElementById('material-name');
      if (materialNameEl) materialNameEl.textContent = currentMaterialInfo.name;
    }

    // 更新配置参数显示
    this.updateConfigDisplay();
  }

  /**
   * 更新配置参数显示
   */
  private async updateConfigDisplay(): Promise<void> {
    try {
      const scenePreset = await this.presetLoader.loadScene(this.currentScene);
      const library = await this.presetLoader.loadMaterialLibrary(this.currentMaterialLibrary);
      const material = library.presets?.find((m: any) => m.id === this.currentMaterial);

      const configPanel = document.getElementById('config-display');
      if (!configPanel) return;

      const html = `
        <h3>当前配置</h3>
        <div class="config-section">
          <h4>场景: ${scenePreset.name}</h4>
          <div class="config-item">
            <label>后处理启用:</label>
            <span>${scenePreset.postProcessing?.enabled ? '是' : '否'}</span>
          </div>
          ${
            scenePreset.postProcessing?.bloom?.enabled
              ? `<div class="config-item">
              <label>Bloom强度:</label>
              <span>${scenePreset.postProcessing.bloom.strength}</span>
            </div>`
              : ''
          }
          ${
            scenePreset.postProcessing?.ssao?.enabled
              ? `<div class="config-item">
              <label>SSAO启用:</label>
              <span>是</span>
            </div>`
              : ''
          }
          ${
            scenePreset.vignette?.enabled
              ? `<div class="config-item">
              <label>暗角启用:</label>
              <span>是 (半径倍数: ${scenePreset.vignette.radiusScale})</span>
            </div>`
              : ''
          }
        </div>

        <div class="config-section">
          <h4>材质: ${material?.name || '未知'}</h4>
          <div class="config-item">
            <label>金属度 (Metalness):</label>
            <span>${material?.material?.metalness || 0}</span>
          </div>
          <div class="config-item">
            <label>粗糙度 (Roughness):</label>
            <span>${material?.material?.roughness || 0}</span>
          </div>
          ${
            material?.material?.transmission !== undefined
              ? `<div class="config-item">
              <label>透射率 (Transmission):</label>
              <span>${material.material.transmission}</span>
            </div>`
              : ''
          }
          <div class="config-item">
            <label>环境贴图强度:</label>
            <span>${material?.material?.envMapIntensity || 1.0}</span>
          </div>
        </div>
      `;

      configPanel.innerHTML = html;
    } catch (error) {
      console.error('Failed to update config display:', error);
    }
  }

  /**
   * 绑定全局函数
   */
  private bindGlobalFunctions(): void {
    const self = this;

    (window as any).switchScene = async (sceneName: string) => {
      await self.switchScene(sceneName);
    };

    (window as any).switchMaterialLibrary = async (libraryName: string) => {
      await self.switchMaterialLibrary(libraryName);
    };

    (window as any).switchMaterial = async (materialId: string) => {
      await self.switchMaterial(materialId);
    };

    (window as any).switchModel = async (modelUrl: string) => {
      await self.switchModel(modelUrl);
    };
  }

  /**
   * 获取当前配置状态
   */
  getCurrentState(): {
    scene: string;
    materialLibrary: string;
    material: string;
    model: string;
  } {
    return {
      scene: this.currentScene,
      materialLibrary: this.currentMaterialLibrary,
      material: this.currentMaterial,
      model: this.currentModelId,
    };
  }
}

/**
 * 创建并导出演示实例
 */
let demoInstance: PresetSwitcherDemo | null = null;

export function initPresetSwitcherDemo(): PresetSwitcherDemo {
  if (demoInstance) {
    return demoInstance;
  }
  demoInstance = new PresetSwitcherDemo();
  return demoInstance;
}

export function getPresetSwitcherDemo(): PresetSwitcherDemo | null {
  return demoInstance;
}
