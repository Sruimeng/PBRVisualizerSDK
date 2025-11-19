import { PBRVisualizer } from '@sruim/pbr-visualizer-sdk';

let visualizer: { on: (arg0: string, arg1: { (event: any): void; (stats: any): void; (error: any): void; }) => void; setCamera: (arg0: number[], arg1: number[]) => void; undo: () => void; redo: () => void; shareState: () => any; captureFrame: () => any; setQuality: (arg0: { resolution: number; maxSamples: number; mobileOptimized?: boolean; }) => void; updateModel: (arg0: string, arg1: { materials: { default: { color: string; roughness: number; metalness: number; }; }; }, arg2: { duration: number; }) => any; updateEnvironment: (arg0: { type: string; sphere: { radius: number; pulse: boolean; }; }) => void; };
let currentState = {
    bodyColor: '#ff0000',
    roughness: 0.2,
    metalness: 0.9,
    envIntensity: 1.0
};
let useCustomPMREM = false;

// 初始化可视化器
async function initVisualizer() {
    try {
        const container = document.getElementById('viewer');
        
        visualizer = new PBRVisualizer({
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
                    type: 'noise-sphere',
                    sphere: { radius: 0.8, pulse: true }
                },
                camera: {
                    position: [3, 2, 5],
                    target: [0, 0, 0],
                    fov: 45
                }
            },
            quality: {
                resolution: 1.0,
                maxSamples: 16,
                mobileOptimized: false
            },
            debug: true
        });
        
        // 绑定事件
        visualizer.on('modelLoaded', (event: { modelId: any; }) => {
            console.log(`Model ${event.modelId} loaded`);
            document.getElementById('loading').style.display = 'none';
        });
        
        visualizer.on('performanceUpdate', (stats: { fps: number; drawCalls: string | null; triangles: { toLocaleString: () => string | null; }; memoryUsage: number; }) => {
            document.getElementById('fps').textContent = stats.fps.toFixed(0);
            document.getElementById('drawCalls').textContent = stats.drawCalls;
            document.getElementById('triangles').textContent = stats.triangles.toLocaleString();
            document.getElementById('memory').textContent = (stats.memoryUsage / 1024 / 1024).toFixed(1);
        });
        
        visualizer.on('error', (error: { message: any; }) => {
            console.error('Visualizer error:', error);
            showError(error.message);
        });
        
        setupControls();
        
    } catch (error) {
        console.error('Failed to initialize visualizer:', error);
        showError('初始化失败: ' + error.message);
    }
}

function setupControls() {
    // 颜色选择器
    document.getElementById('bodyColors').addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
            
            const color = e.target.dataset.color;
            currentState.bodyColor = color;
            updateModel();
        }
    });
    
    // 材质滑块
    document.getElementById('roughness').addEventListener('input', (e) => {
        currentState.roughness = parseFloat(e.target.value);
        document.getElementById('roughnessValue').textContent = currentState.roughness.toFixed(2);
        updateModel();
    });
    
    document.getElementById('metalness').addEventListener('input', (e) => {
        currentState.metalness = parseFloat(e.target.value);
        document.getElementById('metalnessValue').textContent = currentState.metalness.toFixed(2);
        updateModel();
    });
    
    document.getElementById('noiseSphere').addEventListener('click', () => {
        visualizer.updateEnvironment({
            type: 'noise-sphere',
            intensity: currentState.envIntensity,
            sphere: { radius: 0.8, pulse: true }
        });
    });
    
    document.getElementById('hdrEnv').addEventListener('click', () => {
        visualizer.updateEnvironment({
            type: 'hdr',
            hdr: { url: '', intensity: currentState.envIntensity }
        });
    });
    
    document.getElementById('procedural').addEventListener('click', () => {
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

    document.getElementById('pmremToggle').addEventListener('click', () => {
        useCustomPMREM = !useCustomPMREM;
        document.getElementById('pmremToggle').textContent = `高精PMREM: ${useCustomPMREM ? '开启' : '关闭'}`;
        applyPMREMMode();
    });
    
    // 环境强度
    document.getElementById('envIntensity').addEventListener('input', (e) => {
        currentState.envIntensity = parseFloat(e.target.value);
        document.getElementById('envIntensityValue').textContent = currentState.envIntensity.toFixed(1);
        updateEnvironment();
    });

    document.getElementById('bgRadius').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('bgRadiusValue').textContent = val.toFixed(2);
        visualizer.updateBackground({ radius: val });
    });
    document.getElementById('bgSmooth').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('bgSmoothValue').textContent = val.toFixed(2);
        visualizer.updateBackground({ smooth: val });
    });
    document.getElementById('bgVignette').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('bgVignetteValue').textContent = val.toFixed(2);
        visualizer.updateBackground({ vignette: val });
    });
    document.getElementById('bgBright').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('bgBrightValue').textContent = val.toFixed(2);
        visualizer.updateBackground({ bright: val });
    });
    
    // 按钮事件
    document.getElementById('resetCamera').addEventListener('click', () => {
        visualizer.setCamera([3, 2, 5], [0, 0, 0]);
    });
    
    document.getElementById('undo').addEventListener('click', () => {
        visualizer.undo();
    });
    
    document.getElementById('redo').addEventListener('click', () => {
        visualizer.redo();
    });
    
    document.getElementById('share').addEventListener('click', async () => {
        try {
            const url = await visualizer.shareState();
            navigator.clipboard.writeText(url);
            alert('配置链接已复制到剪贴板！');
        } catch (error) {
            showError('分享失败: ' + error.message);
        }
    });
    
    document.getElementById('screenshot').addEventListener('click', () => {
        const dataUrl = visualizer.captureFrame();
        const link = document.createElement('a');
        link.download = 'pbr-visualization.png';
        link.href = dataUrl;
        link.click();
    });
    
    // 质量设置
    document.getElementById('qualityHigh').addEventListener('click', () => {
        visualizer.setQuality({ resolution: 1.0, maxSamples: 20 });
    });
    
    document.getElementById('qualityMedium').addEventListener('click', () => {
        visualizer.setQuality({ resolution: 0.85, maxSamples: 12 });
    });
    
    document.getElementById('qualityLow').addEventListener('click', () => {
        visualizer.setQuality({ resolution: 0.7, maxSamples: 6, mobileOptimized: true });
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
    visualizer.updateEnvironment({
        type: 'noise-sphere',
        intensity: currentState.envIntensity,
        sphere: { radius: 0.8, pulse: true },
        useCustomPMREM: useCustomPMREM
    } as any);
}

function applyPMREMMode() {
    // 重新应用当前环境类型，带上 PMREM 开关
    const activeEnvBtn = document.querySelector('.button-group .btn.active') as HTMLElement | null;
    // 简化：直接用当前“噪波球体”环境刷新
    visualizer.updateEnvironment({
        type: 'noise-sphere',
        intensity: currentState.envIntensity,
        sphere: { radius: 0.8, pulse: true },
        useCustomPMREM: useCustomPMREM
    } as any);
}

function showError(message: string | null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.controls-panel').appendChild(errorDiv);
    
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

initVisualizer();
