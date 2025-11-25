import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';
import { Vector3, Color } from 'three';

// 全局类型声明
declare global {
  interface Window {
    applyPreset: (presetName: string) => Promise<void>;
    resetMaterial: () => Promise<void>;
    randomizeMaterial: () => Promise<void>;
  }
}

// 类型定义
interface MaterialPreset {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
}

interface MaterialParams {
  color?: string | Color;
  metalness?: number;
  roughness?: number;
  envMapIntensity?: number;
}

// 材质预设配置
const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  metal: {
    color: '#cccccc',
    metalness: 1.0,
    roughness: 0.2,
    envMapIntensity: 1.5,
  },
  plastic: {
    color: '#4a90e2',
    metalness: 0.0,
    roughness: 0.5,
    envMapIntensity: 0.8,
  },
  glass: {
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.0,
    envMapIntensity: 1.0,
  },
  wood: {
    color: '#8b4513',
    metalness: 0.0,
    roughness: 0.8,
    envMapIntensity: 0.6,
  },
  ceramic: {
    color: '#ffffff',
    metalness: 0.0,
    roughness: 0.1,
    envMapIntensity: 1.2,
  },
  fabric: {
    color: '#9b59b6',
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.4,
  },
};

// 默认材质参数
const DEFAULT_MATERIAL: MaterialParams = {
  color: '#ffffff',
  metalness: 0.5,
  roughness: 0.5,
  envMapIntensity: 1.0,
};

/**
 * 材质编辑器类
 * 负责管理 PBR 材质的参数调整和预设应用
 */
export class MaterialEditor {
  private visualizer: PBRVisualizer | null = null;
  private readonly modelId: string = 'demo_sphere';

  constructor() {
    this.init();
  }

  /**
   * 初始化材质编辑器
   */
  private async init(): Promise<void> {
    try {
      // 创建 PBR Visualizer 实例
      this.visualizer = new PBRVisualizer({
        container: document.getElementById('app')!,
        models: [
          {
            id: this.modelId,
            source: '/demo/glb/test.glb',
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
              autoRotate: true,
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
              enabled: true,
              strength: 0.3,
              radius: 0.4,
              threshold: 0.8,
            },
            ssao: {
              enabled: false,
              kernelRadius: 4,
              minDistance: 0.005,
              maxDistance: 0.1,
            },
            antialiasing: {
              enabled: true,
              type: 'fxaa' as const, // cspell:disable-line
            },
          },
        },
      });

      // 初始化 SDK
      await this.visualizer.initialize();

      // 尝试加载模型
      try {
        // 模型加载逻辑（根据需要调整）
        console.log('SDK initialized, ready to edit materials');
      } catch (modelError) {
        console.warn('Model loading skipped:', modelError);
      }

      // 设置控制器
      this.setupControls();

      // 显示控制面板
      this.showUI();

      console.log('Material Editor initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showError(error);
    }
  }

  /**
   * 设置 UI 控制器
   */
  private setupControls(): void {
    // 颜色控制
    const colorInput = document.getElementById('color') as HTMLInputElement;
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        this.updateMaterial({ color: (e.target as HTMLInputElement).value });
      });
    }

    // 滑块控制
    ['metalness', 'roughness', 'envMapIntensity'].forEach((id) => {
      const slider = document.getElementById(id) as HTMLInputElement;
      const valueSpan = document.getElementById(id + '-value') as HTMLSpanElement;

      if (slider && valueSpan) {
        slider.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          valueSpan.textContent = value.toFixed(2);
          this.updateMaterial({ [id]: value });
        });
      }
    });
  }

  /**
   * 更新材质参数
   */
  private async updateMaterial(params: MaterialParams): Promise<void> {
    if (!this.visualizer) {
      console.warn('[MaterialEditor] Visualizer not initialized');
      return;
    }

    try {
      // 构建符合MaterialState要求的更新对象
      const materialUpdate: any = {};

      // 只有当参数存在时才添加到更新对象中
      if (params.color !== undefined) {
        materialUpdate.color = params.color;
      }
      if (params.metalness !== undefined) {
        materialUpdate.metalness = params.metalness;
      }
      if (params.roughness !== undefined) {
        materialUpdate.roughness = params.roughness;
      }
      if (params.envMapIntensity !== undefined) {
        materialUpdate.envMapIntensity = params.envMapIntensity;
      }

      console.log(`[MaterialEditor] Updating material for model: ${this.modelId}`, materialUpdate);

      await this.visualizer.updateModel(this.modelId, {
        material: materialUpdate,
      });

      console.log(`[MaterialEditor] Material update completed successfully`);
    } catch (error) {
      console.error('[MaterialEditor] Material update failed:', error);
      console.error('[MaterialEditor] Error details:', error);
    }
  }

  /**
   * 应用材质预设
   */
  public async applyPreset(presetName: string): Promise<void> {
    const preset = MATERIAL_PRESETS[presetName];
    if (!preset) return;

    // 更新 UI
    Object.entries(preset).forEach(([key, value]) => {
      const input = document.getElementById(key) as HTMLInputElement;
      if (input) {
        input.value = value.toString();
        const valueSpan = document.getElementById(key + '-value') as HTMLSpanElement;
        if (valueSpan) {
          valueSpan.textContent = typeof value === 'number' ? value.toFixed(2) : value;
        }
      }
    });

    // 更新材质
    await this.updateMaterial(preset);
  }

  /**
   * 重置材质到默认状态
   */
  public async resetMaterial(): Promise<void> {
    Object.entries(DEFAULT_MATERIAL).forEach(([key, value]) => {
      const input = document.getElementById(key) as HTMLInputElement;
      if (input) {
        input.value = value.toString();
        const valueSpan = document.getElementById(key + '-value') as HTMLSpanElement;
        if (valueSpan && typeof value === 'number') {
          valueSpan.textContent = value.toFixed(2);
        }
      }
    });

    await this.updateMaterial(DEFAULT_MATERIAL);
  }

  /**
   * 生成随机材质
   */
  public async randomizeMaterial(): Promise<void> {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const randomMetalness = Math.random();
    const randomRoughness = Math.random();

    const colorInput = document.getElementById('color') as HTMLInputElement;
    const metalnessInput = document.getElementById('metalness') as HTMLInputElement;
    const roughnessInput = document.getElementById('roughness') as HTMLInputElement;
    const metalnessValue = document.getElementById('metalness-value') as HTMLSpanElement;
    const roughnessValue = document.getElementById('roughness-value') as HTMLSpanElement;

    if (colorInput) colorInput.value = randomColor;
    if (metalnessInput) metalnessInput.value = randomMetalness.toString();
    if (roughnessInput) roughnessInput.value = randomRoughness.toString();
    if (metalnessValue) metalnessValue.textContent = randomMetalness.toFixed(2);
    if (roughnessValue) roughnessValue.textContent = randomRoughness.toFixed(2);

    await this.updateMaterial({
      color: randomColor,
      metalness: randomMetalness,
      roughness: randomRoughness,
    });
  }

  /**
   * 显示 UI 界面
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
      <p style="margin-top: 10px; font-size: 12px;">
        建议: 请查看浏览器控制台以获取更多调试信息
      </p>
      <button onclick="location.reload()">重新加载</button>
    `;
    document.body.appendChild(errorDiv);
  }
}

// 全局函数，供 HTML 调用
let materialEditor: MaterialEditor;

// 应用预设
window.applyPreset = async function (presetName: string): Promise<void> {
  if (materialEditor) {
    await materialEditor.applyPreset(presetName);
  }
};

// 重置材质
window.resetMaterial = async function (): Promise<void> {
  if (materialEditor) {
    await materialEditor.resetMaterial();
  }
};

// 随机材质
window.randomizeMaterial = async function (): Promise<void> {
  if (materialEditor) {
    await materialEditor.randomizeMaterial();
  }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  materialEditor = new MaterialEditor();
});
