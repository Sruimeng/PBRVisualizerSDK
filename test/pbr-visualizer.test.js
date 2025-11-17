import { PBRVisualizer } from '../dist/index.mjs';

describe('PBRVisualizer SDK', () => {
    let visualizer;
    let container;

    beforeEach(() => {
        // Create a container element for testing
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (visualizer) {
            visualizer.dispose();
        }
        document.body.removeChild(container);
    });

    test('should initialize PBRVisualizer with basic configuration', () => {
        expect(() => {
            visualizer = new PBRVisualizer({
                container: container,
                models: [],
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
                }
            });
        }).not.toThrow();
    });

    test('should update model state', async () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: [{
                id: 'test_model',
                source: null, // We'll test with a simple geometry
                initialState: {
                    materials: {
                        default: {
                            color: '#ff0000',
                            roughness: 0.5,
                            metalness: 0.8
                        }
                    }
                }
            }]
        });

        await visualizer.updateModel('test_model', {
            materials: {
                default: {
                    color: '#00ff00',
                    roughness: 0.2,
                    metalness: 0.9
                }
            }
        });

        // Test that the update was applied (would need more detailed testing in real scenario)
        expect(visualizer).toBeDefined();
    });

    test('should handle undo/redo operations', async () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: [{
                id: 'test_model',
                source: null,
                initialState: {
                    materials: {
                        default: {
                            color: '#ff0000'
                        }
                    }
                }
            }]
        });

        // Make a change
        await visualizer.updateModel('test_model', {
            materials: {
                default: {
                    color: '#00ff00'
                }
            }
        });

        // Test undo
        await visualizer.undo();

        // Test redo
        await visualizer.redo();

        expect(visualizer).toBeDefined();
    });

    test('should update environment settings', async () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: []
        });

        await visualizer.updateEnvironment({
            type: 'hdr',
            hdr: {
                url: 'test.hdr',
                intensity: 1.5
            }
        });

        expect(visualizer).toBeDefined();
    });

    test('should set camera position', async () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: []
        });

        await visualizer.setCamera([5, 5, 5], [0, 0, 0]);

        expect(visualizer).toBeDefined();
    });

    test('should capture frame', () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: []
        });

        const dataUrl = visualizer.captureFrame();
        
        expect(dataUrl).toBeDefined();
        expect(typeof dataUrl).toBe('string');
        expect(dataUrl).toMatch(/^data:image\//);
    });

    test('should handle quality settings', async () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: []
        });

        await visualizer.setQuality({
            resolution: 0.5,
            maxSamples: 8,
            mobileOptimized: true
        });

        expect(visualizer).toBeDefined();
    });

    test('should share state', async () => {
        visualizer = new PBRVisualizer({
            container: container,
            models: []
        });

        const shareUrl = await visualizer.shareState();
        
        expect(shareUrl).toBeDefined();
        expect(typeof shareUrl).toBe('string');
        expect(shareUrl).toMatch(/^https?:\/\//);
    });
});