/**
 * PBR Visualizer SDK 预设系统使用示例
 *
 * 本文件展示了如何在项目中使用预设系统
 */

// ============================================================================
// 示例 1: 加载并应用场景预设
// ============================================================================

import { PBRVisualizer } from '@pbr-visualizer/sdk';
import type { GlobalState } from '@pbr-visualizer/sdk';

// 1.1 基础场景加载
async function example_loadScenePreset() {
  // 动态导入预设
  const productPreset = await import('/demo/assets/presets/scenes/product-showcase.json');

  const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas') as HTMLElement,
    models: [
      {
        id: 'product-model',
        source: '/path/to/product.glb'
      }
    ],
    initialGlobalState: productPreset.default as GlobalState
  });
}

// 1.2 在运行时切换场景预设
async function example_switchScenePresets() {
  const scenes = [
    '/demo/assets/presets/scenes/product-showcase.json',
    '/demo/assets/presets/scenes/character-display.json',
    '/demo/assets/presets/scenes/tech-modern.json',
    '/demo/assets/presets/scenes/artistic-gallery.json',
    '/demo/assets/presets/scenes/minimal-clean.json'
  ];

  let currentSceneIndex = 0;

  async function switchToNextScene(visualizer: PBRVisualizer) {
    currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
    const sceneModule = await import(scenes[currentSceneIndex]);
    const scenePreset = sceneModule.default as GlobalState;

    visualizer.updateGlobalState(scenePreset);
    console.log(`Switched to scene: ${scenePreset}`);
  }

  return { switchToNextScene };
}

// ============================================================================
// 示例 2: 加载并应用材质预sets
// ============================================================================

import type { MaterialState } from '@pbr-visualizer/sdk';

// 2.1 加载金属材质库
async function example_loadMetalMaterials(visualizer: PBRVisualizer) {
  const metalsLibrary = await import('/demo/assets/presets/materials/metals.json');

  // 获取具体预设
  const polishedSteel = metalsLibrary.default.presets[0];
  const copper = metalsLibrary.default.presets[2];

  // 应用抛光钢
  visualizer.setModelState('product-model', {
    material: polishedSteel.material as MaterialState
  });
}

// 2.2 加载所有材质库并创建选择器
async function example_loadAllMaterialLibraries() {
  const libraries = {
    metals: '/demo/assets/presets/materials/metals.json',
    plastics: '/demo/assets/presets/materials/plastics.json',
    glass: '/demo/assets/presets/materials/glass.json',
    special: '/demo/assets/presets/materials/special.json'
  };

  const loadedLibraries: Record<string, any> = {};

  for (const [name, path] of Object.entries(libraries)) {
    const module = await import(path);
    loadedLibraries[name] = module.default;
  }

  return loadedLibraries;
}

// 2.3 动态应用材质预设
async function example_applyMaterial(
  visualizer: PBRVisualizer,
  modelId: string,
  category: string,
  presetId: string
) {
  const libraryPath = `/demo/assets/presets/materials/${category}.json`;
  const library = await import(libraryPath);

  const preset = library.default.presets.find((p: any) => p.id === presetId);
  if (preset) {
    visualizer.setModelState(modelId, {
      material: preset.material as MaterialState
    });
    console.log(`Applied material: ${preset.name}`);
  } else {
    console.warn(`Material preset not found: ${presetId}`);
  }
}

// ============================================================================
// 示例 3: 浏览预设目录
// ============================================================================

// 3.1 加载目录并显示所有可用预设
async function example_browsePresets() {
  const catalog = await import('/demo/assets/presets/catalog.json');

  console.log('=== 场景预设 ===');
  catalog.default.scenes.forEach((scene: any) => {
    console.log(`- ${scene.name} (${scene.id}): ${scene.description}`);
    console.log(`  标签: ${scene.tags.join(', ')}`);
  });

  console.log('\n=== 材质库 ===');
  catalog.default.materials.forEach((lib: any) => {
    console.log(`- ${lib.name} (${lib.id}): ${lib.description}`);
    console.log(`  包含 ${lib.presetCount} 个预设`);
  });
}

// 3.2 创建预设选择UI
async function example_createPresetUI() {
  const catalog = await import('/demo/assets/presets/catalog.json');

  // 创建场景选择器
  const sceneSelect = document.createElement('select');
  sceneSelect.id = 'scene-selector';

  catalog.default.scenes.forEach((scene: any) => {
    const option = document.createElement('option');
    option.value = scene.id;
    option.textContent = scene.name;
    sceneSelect.appendChild(option);
  });

  // 创建材质选择器
  const materialSelect = document.createElement('select');
  materialSelect.id = 'material-selector';

  catalog.default.materials.forEach((lib: any) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = lib.name;

    lib.samples.forEach((sample: any) => {
      const option = document.createElement('option');
      option.value = sample.id;
      option.textContent = sample.name;
      optgroup.appendChild(option);
    });

    materialSelect.appendChild(optgroup);
  });

  return { sceneSelect, materialSelect };
}

// ============================================================================
// 示例 4: 完整的交互应用
// ============================================================================

// 4.1 创建完整的预设管理器
class PresetManager {
  private visualizer: PBRVisualizer;
  private currentScene: string = 'product-showcase';
  private currentMaterial: { category: string; id: string } = {
    category: 'metals',
    id: 'polished-steel'
  };

  constructor(visualizer: PBRVisualizer) {
    this.visualizer = visualizer;
  }

  async loadScene(sceneId: string) {
    try {
      const module = await import(
        `/demo/assets/presets/scenes/${sceneId}.json`
      );
      const scenePreset = module.default as GlobalState;
      this.visualizer.updateGlobalState(scenePreset);
      this.currentScene = sceneId;
      console.log(`Scene loaded: ${sceneId}`);
    } catch (error) {
      console.error(`Failed to load scene: ${sceneId}`, error);
    }
  }

  async loadMaterial(modelId: string, category: string, materialId: string) {
    try {
      const module = await import(
        `/demo/assets/presets/materials/${category}.json`
      );
      const preset = module.default.presets.find((p: any) => p.id === materialId);

      if (preset) {
        this.visualizer.setModelState(modelId, {
          material: preset.material as MaterialState
        });
        this.currentMaterial = { category, id: materialId };
        console.log(`Material loaded: ${preset.name}`);
      }
    } catch (error) {
      console.error(`Failed to load material: ${materialId}`, error);
    }
  }

  async applyPresetCombo(
    modelId: string,
    sceneId: string,
    materialCategory: string,
    materialId: string
  ) {
    // 同时加载场景和材质
    await Promise.all([
      this.loadScene(sceneId),
      this.loadMaterial(modelId, materialCategory, materialId)
    ]);
  }

  getCurrentState() {
    return {
      scene: this.currentScene,
      material: this.currentMaterial
    };
  }
}

// 4.2 使用PresetManager的完整示例
async function example_fullApplication() {
  // 初始化可视化器
  const visualizer = new PBRVisualizer({
    container: document.getElementById('canvas') as HTMLElement,
    models: [
      {
        id: 'main-model',
        source: '/path/to/model.glb'
      }
    ],
    initialGlobalState: {
      environment: {
        url: '/demo/hdr/env.hdr',
        intensity: 1.0
      },
      sceneSettings: {
        background: { r: 0, g: 0, b: 0 } as any
      }
    }
  });

  // 创建预设管理器
  const presetManager = new PresetManager(visualizer);

  // 加载初始场景
  await presetManager.loadScene('product-showcase');

  // 加载初始材质
  await presetManager.loadMaterial('main-model', 'metals', 'polished-steel');

  // 设置UI事件监听器
  const sceneSelect = document.getElementById('scene-selector') as HTMLSelectElement;
  const materialSelect = document.getElementById('material-selector') as HTMLSelectElement;

  if (sceneSelect) {
    sceneSelect.addEventListener('change', async (e) => {
      const sceneId = (e.target as HTMLSelectElement).value;
      await presetManager.loadScene(sceneId);
    });
  }

  if (materialSelect) {
    materialSelect.addEventListener('change', async (e) => {
      const materialId = (e.target as HTMLSelectElement).value;
      // 从所有库中查找材质
      const catalog = await import('/demo/assets/presets/catalog.json');

      for (const lib of catalog.default.materials) {
        const found = lib.samples.some((s: any) => s.id === materialId);
        if (found) {
          await presetManager.loadMaterial('main-model', lib.id, materialId);
          break;
        }
      }
    });
  }

  return { visualizer, presetManager };
}

// ============================================================================
// 示例 5: 高级用法 - 预设组合和动画过渡
// ============================================================================

// 5.1 定义预设组合
interface PresetCombo {
  name: string;
  scene: string;
  materials: {
    modelId: string;
    category: string;
    presetId: string;
  }[];
}

const PRESET_COMBOS: Record<string, PresetCombo> = {
  'elegant-showcase': {
    name: '优雅展示',
    scene: 'product-showcase',
    materials: [
      { modelId: 'main-model', category: 'metals', presetId: 'chrome' },
      { modelId: 'accent-model', category: 'glass', presetId: 'clear-glass' }
    ]
  },
  'tech-futuristic': {
    name: '科技未来',
    scene: 'tech-modern',
    materials: [
      { modelId: 'main-model', category: 'metals', presetId: 'brushed-aluminum' },
      { modelId: 'accent-model', category: 'plastics', presetId: 'black-plastic' }
    ]
  },
  'artistic-mood': {
    name: '艺术氛围',
    scene: 'artistic-gallery',
    materials: [
      { modelId: 'main-model', category: 'special', presetId: 'leather' },
      { modelId: 'accent-model', category: 'special', presetId: 'wood-dark' }
    ]
  }
};

// 5.2 应用预设组合
async function example_applyPresetCombo(
  presetManager: PresetManager,
  comboName: string
) {
  const combo = PRESET_COMBOS[comboName];
  if (!combo) {
    console.error(`Preset combo not found: ${comboName}`);
    return;
  }

  // 加载场景
  await presetManager.loadScene(combo.scene);

  // 加载所有材质
  for (const material of combo.materials) {
    await presetManager.loadMaterial(
      material.modelId,
      material.category,
      material.presetId
    );
  }

  console.log(`Applied preset combo: ${combo.name}`);
}

// 5.3 预设过渡动画（需要gsap库）
async function example_animatedPresetTransition(
  visualizer: PBRVisualizer,
  fromScene: string,
  toScene: string,
  duration: number = 1.0
) {
  // 注意：这个示例假设安装了gsap
  // npm install gsap

  try {
    const gsap = await import('gsap');

    const fromModule = await import(`/demo/assets/presets/scenes/${fromScene}.json`);
    const toModule = await import(`/demo/assets/presets/scenes/${toScene}.json`);

    const fromScene_data = fromModule.default;
    const toScene_data = toModule.default;

    // 动画过渡参数
    gsap.default.to(fromScene_data.postProcessing, {
      'bloom.strength': toScene_data.postProcessing.bloom.strength,
      'vignette.brightness': toScene_data.vignette.brightness,
      duration: duration,
      onUpdate: () => {
        // 在动画过程中更新visualizer
        // visualizer.updateGlobalState(fromScene_data);
      }
    });
  } catch (error) {
    console.error('Transition animation failed', error);
  }
}

// ============================================================================
// 示例 6: 响应式预设选择（基于窗口大小）
// ============================================================================

// 6.1 根据性能选择合适的预设
class ResponsivePresetSelector {
  private presetManager: PresetManager;

  constructor(presetManager: PresetManager) {
    this.presetManager = presetManager;
    this.setupResizeListener();
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pixelCount = vw * vh;

      // 根据分辨率选择预设
      if (pixelCount < 1366 * 768) {
        // 低分辨率：使用简单预设
        this.presetManager.loadScene('minimal-clean');
      } else if (pixelCount < 1920 * 1080) {
        // 中分辨率：使用平衡预设
        this.presetManager.loadScene('product-showcase');
      } else {
        // 高分辨率：使用高效果预设
        this.presetManager.loadScene('tech-modern');
      }
    });
  }
}

// ============================================================================
// 导出示例函数
// ============================================================================

export {
  example_loadScenePreset,
  example_switchScenePresets,
  example_loadMetalMaterials,
  example_loadAllMaterialLibraries,
  example_applyMaterial,
  example_browsePresets,
  example_createPresetUI,
  example_fullApplication,
  example_applyPresetCombo,
  example_animatedPresetTransition,
  PresetManager,
  ResponsivePresetSelector,
  PRESET_COMBOS
};
