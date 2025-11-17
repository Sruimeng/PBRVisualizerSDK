import * as THREE from 'three';
import { QualityConfig, PostProcessState } from '../types/core';

// 自定义ACES色调映射着色器
const ACESFilmicToneMappingShader = {
  uniforms: {
    tDiffuse: { value: null },
    exposure: { value: 1.0 },
    whitePoint: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float exposure;
    uniform float whitePoint;
    varying vec2 vUv;

    vec3 ACESFilm(vec3 x) {
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb * exposure;
      color = ACESFilm(color);
      color = pow(color, vec3(1.0 / whitePoint));
      gl_FragColor = vec4(color, texel.a);
    }
  `
};

// 简单泛光效果着色器
const BloomShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.5 },
    radius: { value: 0.4 },
    threshold: { value: 0.8 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform float radius;
    uniform float threshold;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      float brightness = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
      
      if (brightness > threshold) {
        texel.rgb *= strength;
      } else {
        texel.rgb *= 0.0;
      }
      
      gl_FragColor = texel;
    }
  `
};

export class PostProcessor {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private quality: QualityConfig;
  private settings: PostProcessState;

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.Camera, quality: QualityConfig) {
    this.renderer = renderer;
    this.camera = camera;
    this.quality = quality;
    this.settings = this.createDefaultSettings();
  }

  updateSettings(settings: PostProcessState): void {
    this.settings = settings;
    
    // 更新色调映射设置
    if (settings.toneMapping.type === 'aces') {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    } else if (settings.toneMapping.type === 'reinhard') {
      this.renderer.toneMapping = THREE.ReinhardToneMapping;
    } else if (settings.toneMapping.type === 'linear') {
      this.renderer.toneMapping = THREE.LinearToneMapping;
    }
    
    this.renderer.toneMappingExposure = settings.toneMapping.exposure;
  }

  updateQuality(quality: QualityConfig): void {
    this.quality = quality;
    
    // 根据质量调整效果强度
    if (quality.mobileOptimized) {
      this.settings.bloom.enabled = false;
      this.settings.antialiasing.enabled = false;
    }
    
    this.updateSettings(this.settings);
  }

  dispose(): void {
    // 清理资源 - 简化实现
  }

  private createDefaultSettings(): PostProcessState {
    return {
      enabled: true,
      toneMapping: {
        type: 'aces',
        exposure: 1.0,
        whitePoint: 1.0
      },
      bloom: {
        enabled: true,
        strength: 0.5,
        radius: 0.4,
        threshold: 0.8
      },
      antialiasing: {
        type: 'fxaa',
        enabled: true
      }
    };
  }

  private updateToneMappingSettings(): void {
    // 简化实现
  }

  private updateBloomSettings(): void {
    // 简化实现
  }

  private switchToReinhardToneMapping(): void {
    // 切换到Reinhard色调映射
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
  }

  private switchToLinearToneMapping(): void {
    // 切换到线性色调映射
    this.renderer.toneMapping = THREE.LinearToneMapping;
  }

  private removeToneMappingPass(): void {
    // 简化实现
  }
}