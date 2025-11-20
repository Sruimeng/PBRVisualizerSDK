import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { QualityConfig, ModelSource } from '../types/core';

export class ModelManager {
  private quality: QualityConfig;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private loadedModels: Map<string, THREE.Object3D> = new Map();
  private modelStats: Map<string, { triangles: number; materials: number }> = new Map();

  constructor(quality: QualityConfig) {
    this.quality = quality;
    this.initializeLoaders();
  }

  async loadModel(modelId: string, source: ModelSource): Promise<THREE.Object3D> {
    try {
      let object: THREE.Object3D;

      if (typeof source === 'string') {
        // URL加载
        object = await this.loadFromURL(source);
      } else if (source instanceof File) {
        // 文件加载
        object = await this.loadFromFile(source);
      } else if (source instanceof Blob) {
        // Blob加载
        object = await this.loadFromBlob(source);
      } else if (source instanceof ArrayBuffer) {
        // ArrayBuffer加载（假设是GLB格式）
        object = await this.loadFromArrayBuffer(source);
      } else if ('url' in source && 'type' in source) {
        // 带类型的URL
        object = await this.loadFromURL(source.url);
      } else {
        throw new Error('Unsupported model source type');
      }

      // 设置模型属性
      object.name = modelId;
      this.setupModel(object);

      // 统计模型信息
      const stats = this.calculateModelStats(object);
      this.modelStats.set(modelId, stats);

      // 缓存模型
      this.loadedModels.set(modelId, object);

      return object;
    } catch (error) {
      console.warn(`Failed to load model ${modelId}: ${error}. Using placeholder primitive.`);
      const placeholder = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.2 })
      );
      placeholder.name = modelId;
      this.setupModel(placeholder);
      const stats = this.calculateModelStats(placeholder);
      this.modelStats.set(modelId, stats);
      this.loadedModels.set(modelId, placeholder);
      return placeholder;
    }
  }

  getModel(modelId: string): THREE.Object3D | undefined {
    return this.loadedModels.get(modelId);
  }

  getTriangleCount(modelId: string): number {
    return this.modelStats.get(modelId)?.triangles || 0;
  }

  getMaterialCount(modelId: string): number {
    return this.modelStats.get(modelId)?.materials || 0;
  }

  removeModel(modelId: string): boolean {
    const model = this.loadedModels.get(modelId);
    if (model) {
      this.disposeObject(model);
      this.loadedModels.delete(modelId);
      this.modelStats.delete(modelId);
      return true;
    }
    return false;
  }

  dispose(): void {
    this.loadedModels.forEach(model => {
      this.disposeObject(model);
    });
    this.loadedModels.clear();
    this.modelStats.clear();
  }

  private initializeLoaders(): void {
    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    
    // 设置Draco解码器路径
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  private async loadFromURL(url: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf.scene);
        },
        (progress) => {
          console.log(`Loading ${url}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  private async loadFromFile(file: File): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        this.loadFromArrayBuffer(arrayBuffer)
          .then(resolve)
          .catch(reject);
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private async loadFromBlob(blob: Blob): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        this.loadFromArrayBuffer(arrayBuffer)
          .then(resolve)
          .catch(reject);
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  private async loadFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.parse(
        arrayBuffer,
        '',
        (gltf) => {
          resolve(gltf.scene);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  private setupModel(object: THREE.Object3D): void {
    // 优化模型设置
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.optimizeMesh(child);
        this.setupMaterialNames(child);
      }
    });

    // 应用质量设置
    this.applyQualitySettings(object);

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;
  }

  private optimizeMesh(mesh: THREE.Mesh): void {
    // 根据质量设置优化网格
    if (this.quality.mobileOptimized) {
      // 移动端优化
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }
    }

    // 启用阴影
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  private setupMaterialNames(mesh: THREE.Mesh): void {
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material, index) => {
          if (!material.name) {
            material.name = `material_${index}`;
          }
        });
      } else {
        if (!mesh.material.name) {
          mesh.material.name = 'material_0';
        }
      }

      // 存储材质名称到userData
      if (Array.isArray(mesh.material)) {
        mesh.userData.materialNames = mesh.material.map(m => m.name);
      } else {
        mesh.userData.materialName = mesh.material.name;
      }
    }
  }

  private applyQualitySettings(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => this.applyMaterialQuality(mat));
        } else {
          this.applyMaterialQuality(child.material);
        }
      }
    });
  }

  private applyMaterialQuality(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      // 根据质量设置调整材质属性
      if (this.quality.mobileOptimized) {
        // 移动端简化材质
        material.roughness = Math.max(material.roughness, 0.1);
        material.metalness = Math.min(material.metalness, 0.9);
      }

      // 纹理大小限制
      if (material.map && material.map.image) {
        const maxSize = this.quality.maxTextureSize;
        if (material.map.image.width > maxSize || material.map.image.height > maxSize) {
          material.map.minFilter = THREE.LinearFilter;
          material.map.magFilter = THREE.LinearFilter;
        }
      }
    }
  }

  private calculateModelStats(object: THREE.Object3D): { triangles: number; materials: number } {
    let triangles = 0;
    let materials = new Set<string>();

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        if (geometry.index) {
          triangles += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangles += geometry.attributes.position.count / 3;
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => materials.add(mat.name));
          } else {
            materials.add(child.material.name);
          }
        }
      }
    });

    return {
      triangles: Math.floor(triangles),
      materials: materials.size
    };
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.disposeMaterial(mat));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });
  }

  private disposeMaterial(material: THREE.Material): void {
    // 清理材质纹理
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    });
    
    material.dispose();
  }
}
