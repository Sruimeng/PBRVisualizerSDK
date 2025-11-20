import { PBRVisualizer, VisualizerOptions, EnvironmentConfig } from '@sruim/pbr-visualizer-sdk';
import { Vector3 } from 'three';

let visualizer: PBRVisualizer;
let currentState = {
    bodyColor: '#ff0000',
    roughness: 0.2,
    metalness: 0.9,
    envIntensity: 1.0
};
let useCustomPMREM = false;
const HDR_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr';

// 初始化可视化器
async function initVisualizer() {
    try {
        const container = document.getElementById('viewer');
        if (!container) throw new Error('Viewer container not found');
        
        const options: VisualizerOptions = {
            container: container,
            models: [
                {
                    id: 'demo_model',
                    source: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
                    initialState: {
                        materials: {
                            default: {
                                color: currentState.bodyColor,
                                roughness: currentState.roughness,
                                metalness: currentState.metalness
                            }
                        }
                    }
                }
            ],
            initialGlobalState: {
                environment: {
                    type: 'hdr',
                    hdr: { url: HDR_URL, intensity: 1.0 }
                },
                camera: {
                    position: new Vector3(3, 2, 5),
                    target: new Vector3(0, 0, 0),
                    fov: 40,
                    near: 0.1,
                    far: 1000
                }
            },
            quality: {
                resolution: 1.0,
                maxSamples: 16,
                mobileOptimized: false
            },
            debug: true
        };

        visualizer = new PBRVisualizer(options);
        
        // 绑定事件
        visualizer.on('modelLoaded', (event: any) => {
            console.log(`Model ${event.modelId} loaded`);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.style.display = 'none';
        });
        
        visualizer.on('performanceUpdate', (stats: any) => {
            const fpsEl = document.getElementById('fps');
            const drawCallsEl = document.getElementById('drawCalls');
            const trianglesEl = document.getElementById('triangles');
            const memoryEl = document.getElementById('memory');

            if (fpsEl) fpsEl.textContent = stats.fps.toFixed(0);
            if (drawCallsEl) drawCallsEl.textContent = stats.drawCalls;
            if (trianglesEl) trianglesEl.textContent = stats.triangles.toLocaleString();
            if (memoryEl) memoryEl.textContent = (stats.memoryUsage / 1024 / 1024).toFixed(1);
        });
        
        visualizer.on('error', (error: any) => {
            console.error('Visualizer error:', error);
            showError(error.message);
        });
        
        setupControls();
        
    } catch (error: any) {
        console.error('Failed to initialize visualizer:', error);
        showError('初始化失败: ' + error.message);
    }
}

function setupControls() {
    // 颜色选择器
    document.getElementById('bodyColors')?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            target.classList.add('active');
            
            const color = target.dataset.color;
            if (color) {
                currentState.bodyColor = color;
                updateModel();
            }
        }
    });
    
    // 材质滑块
    document.getElementById('roughness')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        currentState.roughness = parseFloat(target.value);
        const valEl = document.getElementById('roughnessValue');
        if (valEl) valEl.textContent = currentState.roughness.toFixed(2);
        updateModel();
    });
    
    document.getElementById('metalness')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        currentState.metalness = parseFloat(target.value);
        const valEl = document.getElementById('metalnessValue');
        if (valEl) valEl.textContent = currentState.metalness.toFixed(2);
        updateModel();
    });
    
    document.getElementById('noiseEnv')?.addEventListener('click', () => {
        visualizer.updateEnvironment({
            type: 'noise-sphere',
            intensity: currentState.envIntensity,
            sphere: { radius: 0.8, pulse: true }
        });
    });
    
    document.getElementById('hdrEnv')?.addEventListener('click', () => {
        visualizer.updateEnvironment({
            type: 'hdr',
            hdr: { url: HDR_URL, intensity: currentState.envIntensity }
        });
    });
    
    document.getElementById('procedural')?.addEventListener('click', () => {
        visualizer.updateEnvironment({
            type: 'procedural',
            intensity: currentState.envIntensity,
            procedural: {
                resolution: 512,
                gradient: {
                    stops: [
                        { position: 0, color: '#87CEEB' },
                        { position: 0.5, color: '#98FB98' },
                        { position: 1, color: '#FFB6C1' }
                    ]
                }
            }
        });
    });

    document.getElementById('pmremToggle')?.addEventListener('click', () => {
        useCustomPMREM = !useCustomPMREM;
        const toggleEl = document.getElementById('pmremToggle');
        if (toggleEl) toggleEl.textContent = `高精PMREM: ${useCustomPMREM ? '开启' : '关闭'}`;
        applyPMREMMode();
    });
    
    // 环境强度
    document.getElementById('envIntensity')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        currentState.envIntensity = parseFloat(target.value);
        const valEl = document.getElementById('envIntensityValue');
        if (valEl) valEl.textContent = currentState.envIntensity.toFixed(1);
        updateEnvironment();
    });

    document.getElementById('bgRadius')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const val = parseFloat(target.value);
        const valEl = document.getElementById('bgRadiusValue');
        if (valEl) valEl.textContent = val.toFixed(2);
        visualizer.updateBackground({ radius: val });
    });
    document.getElementById('bgSmooth')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const val = parseFloat(target.value);
        const valEl = document.getElementById('bgSmoothValue');
        if (valEl) valEl.textContent = val.toFixed(2);
        visualizer.updateBackground({ smooth: val });
    });
    document.getElementById('bgVignette')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const val = parseFloat(target.value);
        const valEl = document.getElementById('bgVignetteValue');
        if (valEl) valEl.textContent = val.toFixed(2);
        visualizer.updateBackground({ vignette: val });
    });
    document.getElementById('bgBright')?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const val = parseFloat(target.value);
        const valEl = document.getElementById('bgBrightValue');
        if (valEl) valEl.textContent = val.toFixed(2);
        visualizer.updateBackground({ bright: val });
    });
    
    // 按钮事件
    document.getElementById('resetCamera')?.addEventListener('click', () => {
        visualizer.setCamera([3, 2, 5], [0, 0, 0]);
    });
    
    document.getElementById('undo')?.addEventListener('click', () => {
        visualizer.undo();
    });
    
    document.getElementById('redo')?.addEventListener('click', () => {
        visualizer.redo();
    });
    
    document.getElementById('share')?.addEventListener('click', async () => {
        try {
            const url = await visualizer.shareState();
            navigator.clipboard.writeText(url);
            alert('配置链接已复制到剪贴板！');
        } catch (error: any) {
            showError('分享失败: ' + error.message);
        }
    });
    
    document.getElementById('screenshot')?.addEventListener('click', () => {
        const dataUrl = visualizer.captureFrame();
        const link = document.createElement('a');
        link.download = 'pbr-visualization.png';
        link.href = dataUrl;
        link.click();
    });
    
    // 质量设置
    document.getElementById('qualityHigh')?.addEventListener('click', () => {
        visualizer.setQuality({ resolution: 1.0, maxSamples: 20 } as any);
    });
    
    document.getElementById('qualityMedium')?.addEventListener('click', () => {
        visualizer.setQuality({ resolution: 0.85, maxSamples: 12 } as any);
    });
    
    document.getElementById('qualityLow')?.addEventListener('click', () => {
        visualizer.setQuality({ resolution: 0.7, maxSamples: 6, mobileOptimized: true } as any);
    });
}

async function updateModel() {
    try {
        await visualizer.updateModel('demo_model', {
            materials: {
                default: {
                    color: currentState.bodyColor,
                    roughness: currentState.roughness,
                    metalness: currentState.metalness
                }
            }
        }, { duration: 300 });
    } catch (error) {
        showError('更新模型失败: ' + error);
    }
}

function updateEnvironment() {
    const config: EnvironmentConfig = {
        type: 'noise-sphere',
        intensity: currentState.envIntensity,
        sphere: { radius: 0.8, pulse: true },
        useCustomPMREM: useCustomPMREM
    };
    visualizer.updateEnvironment(config);
}

function applyPMREMMode() {
    // 重新应用当前环境类型，带上 PMREM 开关
    // 简化：直接用当前“噪波球体”环境刷新
    const config: EnvironmentConfig = {
        type: 'noise-sphere',
        intensity: currentState.envIntensity,
        sphere: { radius: 0.8, pulse: true },
        useCustomPMREM: useCustomPMREM
    };
    visualizer.updateEnvironment(config);
}

function showError(message: string | null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    const panel = document.querySelector('.controls-panel');
    if (panel) panel.appendChild(errorDiv);
    
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

initVisualizer();
    document.getElementById('studioEnv')?.addEventListener('click', () => {
        visualizer.updateEnvironment({
            type: 'studio',
            intensity: currentState.envIntensity,
            studio: {
                keyLight: { color: 0xffffff, intensity: 3.0, position: new Vector3(3, 4, 3) },
                rimLight: { color: 0x4c8bf5 as any, intensity: 5.0, position: new Vector3(-3, 2, -4) },
                fillLight: { color: 0xffeedd as any, intensity: 1.5, position: new Vector3(-4, 0, 4) }
            }
        } as any);
    });
