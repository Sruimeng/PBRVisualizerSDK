import { QualityConfig } from '../types/core';

export class QualityDetector {
  private customQuality: Partial<QualityConfig> | null = null;
  private detectedQuality: QualityConfig;

  constructor() {
    this.detectedQuality = this.detectQuality();
  }

  detectQuality(): QualityConfig {
    if (this.customQuality) {
      return { ...this.detectedQuality, ...this.customQuality };
    }

    // 检测GPU性能
    const gpuTier = this.detectGPUTier();
    
    // 检测设备类型
    const deviceType = this.detectDeviceType();

    // 基于检测结果返回质量配置
    if (gpuTier === 'high' && deviceType === 'desktop') {
      return {
        resolution: 1.0,
        maxSamples: 20,
        mobileOptimized: false,
        textureFormat: 'sRGB8_ALPHA8',
        maxTextureSize: 2048
      };
    } else if (gpuTier === 'medium' || deviceType === 'laptop') {
      return {
        resolution: 0.85,
        maxSamples: 12,
        mobileOptimized: false,
        textureFormat: 'sRGB8_ALPHA8',
        maxTextureSize: 1024
      };
    } else {
      return {
        resolution: 0.7,
        maxSamples: 6,
        mobileOptimized: true,
        textureFormat: 'RGBA8',
        maxTextureSize: 512
      };
    }
  }

  setCustomQuality(quality: Partial<QualityConfig>): void {
    this.customQuality = quality;
  }

  benchmarkPerformance(): QualityConfig {
    // 简单的性能基准测试
    const startTime = performance.now();
    let frameCount = 0;
    
    // 创建一个简单的渲染循环来测试性能
    const testFrame = () => {
      if (performance.now() - startTime < 500) { // 500ms测试
        frameCount++;
        requestAnimationFrame(testFrame);
      } else {
        const fps = frameCount / 0.5;
        
        // 根据FPS确定质量
        if (fps > 45) {
          this.detectedQuality = {
            resolution: 1.0,
            maxSamples: 20,
            mobileOptimized: false,
            textureFormat: 'sRGB8_ALPHA8',
            maxTextureSize: 2048
          };
        } else if (fps > 25) {
          this.detectedQuality = {
            resolution: 0.85,
            maxSamples: 12,
            mobileOptimized: false,
            textureFormat: 'sRGB8_ALPHA8',
            maxTextureSize: 1024
          };
        } else {
          this.detectedQuality = {
            resolution: 0.7,
            maxSamples: 6,
            mobileOptimized: true,
            textureFormat: 'RGBA8',
            maxTextureSize: 512
          };
        }
      }
    };
    
    testFrame();
    return this.detectedQuality;
  }

  private detectGPUTier(): 'high' | 'medium' | 'low' {
    // 使用WebGL获取GPU信息
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      
      if (!gl) {
        return 'low';
      }

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);

      // 基于GPU字符串检测性能等级
      const rendererStr = renderer.toLowerCase();
      const vendorStr = vendor.toLowerCase();

      // 高端GPU
      if (rendererStr.includes('nvidia') && rendererStr.includes('rtx')) {
        return 'high';
      }
      if (rendererStr.includes('amd') && (rendererStr.includes('rx') || rendererStr.includes('radeon'))) {
        return 'high';
      }

      // 中端GPU
      if (rendererStr.includes('nvidia') && rendererStr.includes('gtx')) {
        return 'medium';
      }
      if (rendererStr.includes('intel') && rendererStr.includes('iris')) {
        return 'medium';
      }

      // Apple GPU
      if (vendorStr.includes('apple') && rendererStr.includes('apple')) {
        return 'medium';
      }

      // 低端GPU
      if (rendererStr.includes('intel') && rendererStr.includes('hd')) {
        return 'low';
      }
      if (rendererStr.includes('arm') && rendererStr.includes('mali')) {
        return 'low';
      }
      if (rendererStr.includes('adreno')) {
        return 'low';
      }

      // 默认返回中等
      return 'medium';
    } catch (error) {
      return 'low';
    }
  }

  private detectDeviceType(): 'desktop' | 'laptop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 检测移动设备
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      if (/ipad|tablet/i.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }
    
    // 检测笔记本电脑
    if (/macintosh|windows/i.test(userAgent)) {
      // 简单的电池检测来判断是否为笔记本
      if ('getBattery' in navigator) {
        return 'laptop';
      }
      return 'desktop';
    }
    
    return 'desktop';
  }
}