import * as THREE from 'three';
import { MaterialState } from '../types';

/**
 * 材质系统
 *
 * 负责：
 * - PBR材质的创建和管理
 * - 材质参数动态更新
 * - 材质缓存和复用
 * - 纹理管理和优化
 * - 材质性能监控
 */
export class MaterialSystem {
    private renderer: THREE.WebGLRenderer;

    // 材质缓存
    private materialCache = new Map<string, THREE.Material>();
    private textureCache = new Map<string, THREE.Texture>();

    // 材质配置映射
    private materialConfigs = new Map<string, MaterialState>();

    // 默认材质
    private defaultMaterial: THREE.MeshStandardMaterial;

    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;

        // 创建默认材质
        this.defaultMaterial = this.createDefaultMaterial();

        console.log('MaterialSystem initialized');
    }

    /**
     * 创建默认PBR材质
     */
    private createDefaultMaterial(): THREE.MeshStandardMaterial {
        return new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.2,
            envMapIntensity: 1.0
        });
    }

    /**
     * 创建PBR材质
     */
    public createMaterial(id: string, config: MaterialState): THREE.MeshStandardMaterial {
        // 检查缓存
        const cacheKey = this.getMaterialCacheKey(config);
        if (this.materialCache.has(cacheKey)) {
            return this.materialCache.get(cacheKey)! as THREE.MeshStandardMaterial;
        }

        // 创建新材质
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(config.color),
            roughness: config.roughness,
            metalness: config.metalness,
            emissive: config.emissive ? new THREE.Color(config.emissive) : 0x000000,
            emissiveIntensity: config.emissiveIntensity || 0,
            normalScale: new THREE.Vector2(1, config.normalScale || 1),
            aoMapIntensity: config.aoMapIntensity || 1,
            envMapIntensity: config.envMapIntensity || 1
        });

        // 设置纹理
        if (config.normalMap) {
            material.normalMap = this.loadTexture(config.normalMap);
        }

        if (config.aoMap) {
            material.aoMap = this.loadTexture(config.aoMap);
        }

        if (config.emissiveMap) {
            material.emissiveMap = this.loadTexture(config.emissiveMap);
        }

        if (config.metallicRoughnessMap) {
            material.metalness = 1; // 使用纹理控制
            material.roughness = 1; // 使用纹理控制
            material.metalnessMap = this.loadTexture(config.metallicRoughnessMap);
            material.roughnessMap = this.loadTexture(config.metallicRoughnessMap);
        }

        // 缓存材质
        this.materialCache.set(cacheKey, material);
        this.materialConfigs.set(id, { ...config });

        console.log(`Created PBR material: ${id}`);

        return material;
    }

    /**
     * 获取材质缓存键
     */
    private getMaterialCacheKey(config: MaterialState): string {
        const parts = [
            typeof config.color === 'string' ? config.color : config.color.getHexString(),
            config.roughness.toFixed(3),
            config.metalness.toFixed(3),
            (config.emissiveIntensity || 0).toFixed(3),
            (config.envMapIntensity || 1).toFixed(3),
            config.normalMap || '',
            config.aoMap || '',
            config.emissiveMap || '',
            config.metallicRoughnessMap || ''
        ];

        return parts.join('|');
    }

    /**
     * 加载纹理
     */
    private loadTexture(url: string): THREE.Texture {
        if (this.textureCache.has(url)) {
            return this.textureCache.get(url)!;
        }

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(url);

        // 设置纹理属性
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Note: sRGBEncoding was deprecated, use colorSpace instead

        // 设置各向异性过滤
        const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.anisotropy = maxAnisotropy;

        // 缓存纹理
        this.textureCache.set(url, texture);

        return texture;
    }

    /**
     * 更新材质参数
     */
    public updateMaterial(id: string, updates: Partial<MaterialState>): void {
        const config = this.materialConfigs.get(id);
        if (!config) {
            console.warn(`Material config for '${id}' not found`);
            return;
        }

        // 更新配置
        const newConfig = { ...config, ...updates };
        this.materialConfigs.set(id, newConfig);

        // 查找使用该材质的对象并更新
        // 注意：这里需要配合场景遍历来更新实际的材质
        console.log(`Updated material config for: ${id}`, updates);
    }

    /**
     * 应用材质更新到对象
     */
    public applyMaterialUpdates(object: THREE.Object3D, materialId?: string): void {
        if (!materialId) return;

        const config = this.materialConfigs.get(materialId);
        if (!config) return;

        object.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const material = child.material as THREE.MeshStandardMaterial;

                // 更新基础属性
                if (config.color) {
                    material.color = new THREE.Color(config.color);
                }
                if (config.roughness !== undefined) {
                    material.roughness = config.roughness;
                }
                if (config.metalness !== undefined) {
                    material.metalness = config.metalness;
                }
                if (config.emissive) {
                    material.emissive = new THREE.Color(config.emissive);
                }
                if (config.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = config.emissiveIntensity;
                }
                if (config.normalScale !== undefined) {
                    material.normalScale = new THREE.Vector2(1, config.normalScale);
                }
                if (config.aoMapIntensity !== undefined) {
                    material.aoMapIntensity = config.aoMapIntensity;
                }
                if (config.envMapIntensity !== undefined) {
                    material.envMapIntensity = config.envMapIntensity;
                }

                // 标记材质需要更新
                material.needsUpdate = true;
            }
        });
    }

    /**
     * 优化模型材质（基于ai_studio_code.html的实现）
     */
    public optimizeModelMaterials(model: THREE.Object3D, environmentTexture?: THREE.Texture): void {
        const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;

                // 关闭阴影（使用后处理阴影）
                child.castShadow = false;
                child.receiveShadow = false;

                // 设置纹理各向异性
                if (material.map) {
                    material.map.anisotropy = maxAnisotropy;
                }
                if (material.normalMap) {
                    material.normalMap.anisotropy = maxAnisotropy;
                }
                if (material.roughnessMap) {
                    material.roughnessMap.anisotropy = maxAnisotropy;
                }
                if (material.metalnessMap) {
                    material.metalnessMap.anisotropy = maxAnisotropy;
                }

                // 设置环境反射强度
                if (environmentTexture) {
                    material.envMap = environmentTexture;
                    material.envMapIntensity = 1.0;
                }

                // 确保有法线信息
                if (!child.geometry.attributes.normal) {
                    child.geometry.computeVertexNormals();
                }

                // 标记需要更新
                material.needsUpdate = true;
            }
        });

        console.log('Model materials optimized');
    }

    /**
     * 创建预设材质
     */
    public createPresetMaterial(type: 'metal' | 'plastic' | 'wood' | 'glass' | 'fabric'): MaterialState {
        switch (type) {
            case 'metal':
                return {
                    color: '#888888',
                    roughness: 0.1,
                    metalness: 1.0,
                    envMapIntensity: 1.2
                };

            case 'plastic':
                return {
                    color: '#ffffff',
                    roughness: 0.3,
                    metalness: 0.0,
                    envMapIntensity: 0.8
                };

            case 'wood':
                return {
                    color: '#8b4513',
                    roughness: 0.8,
                    metalness: 0.0,
                    envMapIntensity: 0.5
                };

            case 'glass':
                return {
                    color: '#ffffff',
                    roughness: 0.0,
                    metalness: 0.0,
                    envMapIntensity: 1.0,
                    transmission: 1.0,
                    transparent: true,
                    opacity: 0.9
                } as any; // 需要MeshPhysicalMaterial

            case 'fabric':
                return {
                    color: '#444444',
                    roughness: 1.0,
                    metalness: 0.0,
                    envMapIntensity: 0.3
                };

            default:
                return {
                    color: '#ffffff',
                    roughness: 0.4,
                    metalness: 0.2
                };
        }
    }

    /**
     * 获取材质配置
     */
    public getMaterialConfig(id: string): MaterialState | undefined {
        return this.materialConfigs.get(id);
    }

    /**
     * 获取默认材质
     */
    public getDefaultMaterial(): THREE.MeshStandardMaterial {
        return this.defaultMaterial;
    }

    /**
     * 创建材质变体（用于预览）
     */
    public createMaterialVariants(baseConfig: MaterialState): {
        rough: MaterialState;
        smooth: MaterialState;
        metallic: MaterialState;
        matte: MaterialState;
    } {
        return {
            rough: {
                ...baseConfig,
                roughness: 0.9,
                metalness: 0.1
            },
            smooth: {
                ...baseConfig,
                roughness: 0.1,
                metalness: 0.2
            },
            metallic: {
                ...baseConfig,
                roughness: 0.2,
                metalness: 1.0
            },
            matte: {
                ...baseConfig,
                roughness: 1.0,
                metalness: 0.0,
                envMapIntensity: 0.1
            }
        };
    }

    /**
     * 获取材质使用统计
     */
    public getMaterialStats(): {
        cachedMaterials: number;
        cachedTextures: number;
        memoryUsage: number; // 估算值
    } {
        const materialCount = this.materialCache.size;
        const textureCount = this.textureCache.size;

        // 粗略估算内存使用
        let memoryUsage = 0;
        this.textureCache.forEach(texture => {
            if ((texture as any).image && (texture as any).image.width) {
                const size = (texture as any).image.width * (texture as any).image.height * 4; // RGBA
                memoryUsage += size;
            }
        });

        return {
            cachedMaterials: materialCount,
            cachedTextures: textureCount,
            memoryUsage: memoryUsage / (1024 * 1024) // MB
        };
    }

    /**
     * 清理未使用的资源
     */
    public cleanup(): void {
        // 标记清理
        const usedTextures = new Set<string>();

        this.materialCache.forEach(material => {
            // 检查材质使用的纹理
            const stdMaterial = material as THREE.MeshStandardMaterial;
            [stdMaterial.map, stdMaterial.normalMap, stdMaterial.aoMap, stdMaterial.emissiveMap].forEach(texture => {
                if (texture && texture.name) {
                    usedTextures.add(texture.name);
                }
            });
        });

        // 清理未使用的纹理
        this.textureCache.forEach((texture, url) => {
            if (!usedTextures.has(url)) {
                texture.dispose();
                this.textureCache.delete(url);
            }
        });

        console.log('MaterialSystem cleanup completed');
    }

    /**
     * 销毁材质系统
     */
    public dispose(): void {
        // 清理材质
        this.materialCache.forEach(material => {
            material.dispose();
        });
        this.materialCache.clear();

        // 清理纹理
        this.textureCache.forEach(texture => {
            texture.dispose();
        });
        this.textureCache.clear();

        // 清理配置
        this.materialConfigs.clear();

        // 销毁默认材质
        this.defaultMaterial.dispose();

        console.log('MaterialSystem disposed');
    }
}