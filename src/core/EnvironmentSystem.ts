import * as THREE from 'three';
import { CubeCamera, WebGLCubeRenderTarget } from 'three';
import { QualityConfig, EnvironmentConfig } from '../types/core';

export class EnvironmentSystem {
  private quality: QualityConfig;
  private currentConfig: EnvironmentConfig;
  private noiseSphere: THREE.Mesh | null = null;
  private environmentScene: THREE.Scene;
  private environmentCamera: CubeCamera;
  private pmremRenderTarget: WebGLCubeRenderTarget;

  constructor(quality: QualityConfig) {
    this.quality = quality;
    this.currentConfig = {
      type: 'noise-sphere',
      sphere: { radius: 0.8, pulse: false }
    };

    this.environmentScene = new THREE.Scene();
    this.initializeEnvironmentCamera();
  }

  updateEnvironment(config: EnvironmentConfig): void {
    this.currentConfig = config;
    
    switch (config.type) {
      case 'noise-sphere':
        this.createNoiseSphereEnvironment(config.sphere);
        break;
      case 'hdr':
        this.loadHDREnvironment(config.hdr);
        break;
      case 'procedural':
        this.createProceduralEnvironment(config.procedural);
        break;
    }
  }

  generateEnvironment(): { environmentMap: THREE.Texture; irradianceMap: THREE.Texture } {
    // 简化实现，返回默认环境贴图
    return this.generateDefaultMaps();
  }

  dispose(): void {
    if (this.noiseSphere) {
      this.noiseSphere.geometry.dispose();
      if (this.noiseSphere.material instanceof THREE.Material) {
        this.noiseSphere.material.dispose();
      }
      this.noiseSphere = null;
    }

    if (this.pmremRenderTarget) {
      this.pmremRenderTarget.dispose();
    }

    this.environmentScene.clear();
  }

  private initializeEnvironmentCamera(): void {
    // 简化实现，暂时不初始化相机
  }

  private createNoiseSphereEnvironment(sphereConfig?: EnvironmentConfig['sphere']): void {
    const radius = sphereConfig?.radius || 0.8;
    const pulse = sphereConfig?.pulse || false;

    // 移除旧的噪声球体
    if (this.noiseSphere) {
      this.environmentScene.remove(this.noiseSphere);
    }

    // 创建程序化噪声球体
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulse: { value: pulse },
        frequency: { value: sphereConfig?.frequency || 1.0 },
        amplitude: { value: sphereConfig?.amplitude || 0.1 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        uniform bool pulse;
        uniform float frequency;
        uniform float amplitude;

        // 噪声函数
        float noise(vec3 p) {
          return sin(p.x * frequency + time) * 
                 cos(p.y * frequency + time * 0.7) * 
                 sin(p.z * frequency + time * 1.3);
        }

        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          if (pulse) {
            float n = noise(position * 3.0);
            pos += normal * n * amplitude;
          }
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec3 normal = normalize(vNormal);
          
          // 基于法线的渐变
          float hue = (normal.x + normal.y + normal.z) * 0.5 + 0.5;
          float sat = 0.8;
          float val = 0.9;
          
          vec3 color = hsv2rgb(vec3(hue * 0.3 + time * 0.1, sat, val));
          
          // 添加一些噪声变化
          float noise = sin(vPosition.x * 10.0 + time) * 
                       cos(vPosition.y * 10.0 + time * 0.7) * 0.1;
          
          color += noise;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide
    });

    this.noiseSphere = new THREE.Mesh(geometry, material);
    this.environmentScene.add(this.noiseSphere);
  }

  private loadHDREnvironment(hdrConfig?: EnvironmentConfig['hdr']): void {
    if (!hdrConfig?.url) return;

    // 这里可以实现HDR贴图加载
    // 目前使用占位符
    this.createProceduralEnvironment({
      resolution: 512,
      gradient: {
        stops: [
          { position: 0, color: '#87CEEB' },
          { position: 0.5, color: '#98FB98' },
          { position: 1, color: '#FFB6C1' }
        ]
      }
    });
  }

  private createProceduralEnvironment(proceduralConfig?: EnvironmentConfig['procedural']): void {
    const resolution = proceduralConfig?.resolution || 256;
    const gradient = proceduralConfig?.gradient;

    // 创建程序化天空盒
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    
    let material: THREE.Material;
    
    if (gradient) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          gradientStops: { value: this.convertGradientStops(gradient) }
        },
        vertexShader: `
          varying vec3 vPosition;
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPosition;
          uniform vec3 gradientStops[6]; // 2 stops * 3 colors
          
          vec3 interpolateGradient(float t) {
            if (t < 0.5) {
              return mix(gradientStops[0], gradientStops[1], t * 2.0);
            } else {
              return mix(gradientStops[1], gradientStops[2], (t - 0.5) * 2.0);
            }
          }
          
          void main() {
            float t = (vPosition.y + 50.0) / 100.0; // 归一化到0-1
            vec3 color = interpolateGradient(t);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        side: THREE.BackSide
      });
    } else {
      material = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
      });
    }

    const skybox = new THREE.Mesh(geometry, material);
    this.environmentScene.add(skybox);
  }

  private generateNoiseSphereMaps(): { environmentMap: THREE.Texture; irradianceMap: THREE.Texture } {
    // 渲染环境到立方体贴图
    this.environmentCamera.update(this.renderer, this.environmentScene);
    
    return {
      environmentMap: this.pmremRenderTarget.texture,
      irradianceMap: this.pmremRenderTarget.texture
    };
  }

  private generateHDRMaps(): { environmentMap: THREE.Texture; irradianceMap: THREE.Texture } {
    // 这里应该加载和生成HDR环境贴图
    return this.generateDefaultMaps();
  }

  private generateProceduralMaps(): { environmentMap: THREE.Texture; irradianceMap: THREE.Texture } {
    // 渲染程序化环境
    this.environmentCamera.update(this.renderer, this.environmentScene);
    
    return {
      environmentMap: this.pmremRenderTarget.texture,
      irradianceMap: this.pmremRenderTarget.texture
    };
  }

  private generateDefaultMaps(): { environmentMap: THREE.Texture; irradianceMap: THREE.Texture } {
    // 创建默认环境贴图
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98FB98');
    gradient.addColorStop(1, '#FFB6C1');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return {
      environmentMap: texture,
      irradianceMap: texture
    };
  }

  private convertGradientStops(gradient: EnvironmentConfig['procedural']['gradient']): number[] {
    const colors: number[] = [];
    
    if (gradient?.stops && gradient.stops.length >= 2) {
      gradient.stops.slice(0, 3).forEach(stop => {
        const color = new THREE.Color(stop.color);
        colors.push(color.r, color.g, color.b);
      });
    } else {
      // 默认渐变
      colors.push(0.53, 0.81, 0.92); // #87CEEB
      colors.push(0.60, 0.98, 0.60); // #98FB98
      colors.push(1.00, 0.71, 0.76); // #FFB6C1
    }
    
    return colors;
  }

  // 简化实现，移除renderer依赖
}