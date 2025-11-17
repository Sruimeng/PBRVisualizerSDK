import * as THREE from 'three';
import { QualityConfig } from '../types/core';

export class PMREMGenerator {
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator;
  private cachedPMREMs: Map<string, THREE.WebGLCubeRenderTarget> = new Map();

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
  }

  generatePMREM(environmentMap: THREE.Texture): { 
    envMap: THREE.Texture; 
    irradiance: THREE.Texture 
  } {
    const cacheKey = this.generateCacheKey(environmentMap);
    if (this.cachedPMREMs.has(cacheKey)) {
      const cached = this.cachedPMREMs.get(cacheKey)!;
      return { envMap: cached.texture, irradiance: cached.texture };
    }
    let pmremRenderTarget: THREE.WebGLCubeRenderTarget;
    if ((environmentMap as any).isCubeTexture) {
      pmremRenderTarget = this.pmremGenerator.fromCubemap(environmentMap as unknown as THREE.CubeTexture);
    } else {
      pmremRenderTarget = this.pmremGenerator.fromEquirectangular(environmentMap);
    }
    this.cachedPMREMs.set(cacheKey, pmremRenderTarget);
    return { envMap: pmremRenderTarget.texture, irradiance: pmremRenderTarget.texture };
  }

  generateFromCubeMap(cubeMap: THREE.CubeTexture): { 
    envMap: THREE.Texture; 
    irradiance: THREE.Texture 
  } {
    const cacheKey = this.generateCacheKey(cubeMap);
    
    if (this.cachedPMREMs.has(cacheKey)) {
      const cached = this.cachedPMREMs.get(cacheKey)!;
      return {
        envMap: cached.texture,
        irradiance: cached.texture
      };
    }

    const pmremRenderTarget = this.pmremGenerator.fromCubemap(cubeMap);
    this.cachedPMREMs.set(cacheKey, pmremRenderTarget);

    return {
      envMap: pmremRenderTarget.texture,
      irradiance: pmremRenderTarget.texture
    };
  }

  generateFromScene(scene: THREE.Scene): {
    envMap: THREE.Texture;
    irradiance: THREE.Texture;
  } {
    const pmremRenderTarget = this.pmremGenerator.fromScene(scene);
    return {
      envMap: pmremRenderTarget.texture,
      irradiance: pmremRenderTarget.texture,
    };
  }

  updateQuality(quality: QualityConfig): void {
    // 根据质量设置更新PMREM参数
    const samples = quality.maxSamples;
    
    // 清除缓存以重新生成
    this.clearCache();
  }

  dispose(): void {
    this.clearCache();
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
  }

  clearCache(): void {
    this.cachedPMREMs.forEach(renderTarget => {
      renderTarget.dispose();
    });
    this.cachedPMREMs.clear();
  }

  private generateCacheKey(texture: THREE.Texture): string {
    // 基于纹理属性生成缓存键
    return `${texture.uuid}_${texture.image?.width || 0}_${texture.image?.height || 0}`;
  }
}
