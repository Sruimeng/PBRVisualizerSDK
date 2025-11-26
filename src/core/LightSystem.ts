import * as THREE from 'three';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { LightHelperInfo, LightState } from '../types';

/**
 * 灯光系统
 *
 * 负责：
 * - 多种光源类型的创建和管理
 * - Studio三点布光系统
 * - 动态灯光配置更新
 * - 灯光性能优化
 * - 自适应灯光强度
 */
export class LightSystem {
  private scene: THREE.Scene;
  private lights: Map<string, THREE.Light> = new Map();
  private lightConfigs: Map<string, LightState> = new Map();

  // 灯光Helper管理
  private lightHelpers: Map<string, THREE.Object3D> = new Map();
  private helpersEnabled = false;
  private helperScale = 1.0;

  // Studio三点布光系统
  private keyLight?: THREE.RectAreaLight;
  private fillLight?: THREE.RectAreaLight;
  private rimLight?: THREE.RectAreaLight;

  // Studio灯光Helper
  private keyLightHelper?: RectAreaLightHelper;
  private fillLightHelper?: RectAreaLightHelper;
  private rimLightHelper?: RectAreaLightHelper;

  // 模型边界信息（用于自适应灯光）
  private modelBounds?: {
    center: THREE.Vector3;
    size: THREE.Vector3;
    radius: number;
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeRectAreaLight();
  }

  /**
   * 初始化矩形区域灯光库
   */
  private initializeRectAreaLight(): void {
    RectAreaLightUniformsLib.init();
  }

  /**
   * 创建灯光
   */
  public createLight(id: string, config: LightState): THREE.Light {
    // 移除已存在的灯光
    if (this.lights.has(id)) {
      this.removeLight(id);
    }

    let light: THREE.Light;

    switch (config.type) {
      case 'rectAreaLight':
        light = this.createRectAreaLight(config);
        break;
      case 'pointLight':
        light = this.createPointLight(config);
        break;
      case 'spotLight':
        light = this.createSpotLight(config);
        break;
      case 'directionalLight':
        light = this.createDirectionalLight(config);
        break;
      default:
        throw new Error(`Unsupported light type: ${config.type}`);
    }

    // 存储灯光和配置
    this.lights.set(id, light);
    this.lightConfigs.set(id, { ...config });

    // 添加到场景
    this.scene.add(light);

    return light;
  }

  /**
   * 创建矩形区域灯光
   */
  private createRectAreaLight(config: LightState): THREE.RectAreaLight {
    const size = config.size || [1, 1];
    const light = new THREE.RectAreaLight(config.color, config.intensity, size[0], size[1]);

    light.position.copy(config.position);
    light.visible = config.enabled;

    return light;
  }

  /**
   * 创建点光源
   */
  private createPointLight(config: LightState): THREE.PointLight {
    const light = new THREE.PointLight(
      config.color,
      config.intensity,
      100, // 默认距离
    );

    light.position.copy(config.position);
    light.visible = config.enabled;

    return light;
  }

  /**
   * 创建聚光灯
   */
  private createSpotLight(config: LightState): THREE.SpotLight {
    const light = new THREE.SpotLight(
      config.color,
      config.intensity,
      100, // 默认距离
      Math.PI / 6, // 默认角度
      0.5, // 默认边缘虚化
    );

    light.position.copy(config.position);
    light.visible = config.enabled;

    return light;
  }

  /**
   * 创建平行光
   */
  private createDirectionalLight(config: LightState): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(config.color, config.intensity);
    light.position.copy(config.position);
    light.visible = config.enabled;

    return light;
  }

  /**
   * 更新灯光配置
   */
  public updateLight(id: string, config: Partial<LightState>): void {
    const light = this.lights.get(id);
    const currentConfig = this.lightConfigs.get(id);

    if (!light || !currentConfig) {
      console.warn(`Light with id '${id}' not found`);
      return;
    }

    // 更新配置
    const newConfig = { ...currentConfig, ...config };
    this.lightConfigs.set(id, newConfig);

    // 应用新配置
    this.applyLightConfig(light, newConfig);
  }

  /**
   * 应用灯光配置
   */
  private applyLightConfig(light: THREE.Light, config: LightState): void {
    // 颜色和强度
    light.color = new THREE.Color(config.color);
    light.intensity = config.intensity;
    light.visible = config.enabled;

    // 位置
    light.position.copy(config.position);

    // 特定类型配置
    if (light instanceof THREE.RectAreaLight && config.size) {
      light.width = config.size[0];
      light.height = config.size[1];
    }
  }

  /**
   * 移除灯光
   */
  public removeLight(id: string): void {
    const light = this.lights.get(id);
    if (light) {
      this.scene.remove(light);
      this.lights.delete(id);
      this.lightConfigs.delete(id);
    }
  }

  /**
   * 获取灯光
   */
  public getLight(id: string): THREE.Light | undefined {
    return this.lights.get(id);
  }

  /**
   * 获取灯光配置
   */
  public getLightConfig(id: string): LightState | undefined {
    return this.lightConfigs.get(id);
  }

  /**
   * 创建Studio三点布光系统（基于ai_studio_code.html的实现）
   */
  public createStudioLighting(modelBounds?: {
    center: THREE.Vector3;
    size: THREE.Vector3;
    radius: number;
  }): void {
    this.modelBounds = modelBounds;

    const center = modelBounds?.center || new THREE.Vector3(0, 0, 0);
    const radius = modelBounds?.radius || 1.5;
    const sizeY = modelBounds?.size?.y || 1.0;

    // 移除现有的Studio灯光
    this.removeStudioLighting();

    // 计算灯光参数
    const lightScale = 1 + radius * 0.2;

    // 主光 (Key Light) - 来自右上方
    this.keyLight = new THREE.RectAreaLight(0xffffff, 2.6 * lightScale, radius * 2.4, radius * 2.4);
    this.keyLight.position.set(
      center.x + radius * 1.6,
      center.y + sizeY * 0.8,
      center.z + radius * 1.6,
    );
    this.keyLight.lookAt(center);

    // 轮廓光 (Rim Light) - 来自左后方
    this.rimLight = new THREE.RectAreaLight(
      0xffeedd, // 蓝色调
      1.4 * lightScale,
      radius * 2.0,
      radius * 2.0,
    );
    this.rimLight.position.set(
      center.x - radius * 1.6,
      center.y + sizeY * 0.6,
      center.z - radius * 2.0,
    );
    this.rimLight.lookAt(center);

    // 补光 (Fill Light) - 来自左侧
    this.fillLight = new THREE.RectAreaLight(
      0xffeedd, // 暖色调
      1.4 * lightScale,
      radius * 2.6,
      radius * 2.6,
    );
    this.fillLight.position.set(
      center.x - radius * 1.2,
      center.y + sizeY * 0.2,
      center.z + radius * 1.2,
    );
    this.fillLight.lookAt(center);

    // 添加到场景
    this.scene.add(this.keyLight, this.fillLight, this.rimLight);

    console.log('Studio lighting system created');
  }

  /**
   * 移除Studio三点布光系统
   */
  public removeStudioLighting(): void {
    if (this.keyLight) {
      this.scene.remove(this.keyLight);
      this.keyLight = undefined;
    }
    if (this.fillLight) {
      this.scene.remove(this.fillLight);
      this.fillLight = undefined;
    }
    if (this.rimLight) {
      this.scene.remove(this.rimLight);
      this.rimLight = undefined;
    }
  }

  /**
   * 更新Studio灯光位置（用于动态跟随模型）
   */
  public updateStudioLighting(center: THREE.Vector3): void {
    if (!this.modelBounds) return;

    const radius = this.modelBounds.radius;
    const sizeY = this.modelBounds.size.y;

    if (this.keyLight) {
      this.keyLight.position.set(
        center.x + radius * 1.6,
        center.y + sizeY * 0.8,
        center.z + radius * 1.6,
      );
      this.keyLight.lookAt(center);
    }

    if (this.rimLight) {
      this.rimLight.position.set(
        center.x - radius * 1.6,
        center.y + sizeY * 0.6,
        center.z - radius * 2.0,
      );
      this.rimLight.lookAt(center);
    }

    if (this.fillLight) {
      this.fillLight.position.set(
        center.x - radius * 1.2,
        center.y + sizeY * 0.2,
        center.z + radius * 1.2,
      );
      this.fillLight.lookAt(center);
    }
  }

  /**
   * 调整Studio灯光强度
   */
  public adjustStudioIntensity(multiplier: number): void {
    if (this.keyLight) this.keyLight.intensity *= multiplier;
    if (this.fillLight) this.fillLight.intensity *= multiplier;
    if (this.rimLight) this.rimLight.intensity *= multiplier;
  }

  /**
   * 切换灯光开关
   */
  public toggleLight(id: string): void {
    const light = this.lights.get(id);
    if (light) {
      light.visible = !light.visible;

      const config = this.lightConfigs.get(id);
      if (config) {
        config.enabled = light.visible;
      }
    }
  }

  /**
   * 批量更新所有灯光
   */
  public updateAllLights(configs: Record<string, Partial<LightState>>): void {
    Object.entries(configs).forEach(([id, config]) => {
      this.updateLight(id, config);
    });
  }

  /**
   * 获取所有灯光信息
   */
  public getAllLightsInfo(): Array<{
    id: string;
    type: string;
    enabled: boolean;
    intensity: number;
    color: THREE.Color;
    position: THREE.Vector3;
  }> {
    const lightsInfo: Array<{
      id: string;
      type: string;
      enabled: boolean;
      intensity: number;
      color: THREE.Color;
      position: THREE.Vector3;
    }> = [];

    this.lightConfigs.forEach((config, id) => {
      lightsInfo.push({
        id,
        type: config.type,
        enabled: config.enabled,
        intensity: config.intensity,
        color: new THREE.Color(config.color),
        position: config.position.clone(),
      });
    });

    return lightsInfo;
  }

  /**
   * 清理所有灯光
   */
  public clearAllLights(): void {
    this.lights.forEach((light) => {
      this.scene.remove(light);
    });
    this.lights.clear();
    this.lightConfigs.clear();
    this.removeStudioLighting();
  }

  // ========================
  // 灯光Helper调试功能
  // ========================

  /**
   * 启用/禁用所有灯光Helper
   */
  public setHelpersEnabled(enabled: boolean): void {
    this.helpersEnabled = enabled;

    // 更新所有自定义灯光Helper
    this.lightHelpers.forEach((helper) => {
      helper.visible = enabled;
    });

    // 更新Studio灯光Helper
    if (this.keyLightHelper) this.keyLightHelper.visible = enabled;
    if (this.fillLightHelper) this.fillLightHelper.visible = enabled;
    if (this.rimLightHelper) this.rimLightHelper.visible = enabled;
  }

  /**
   * 设置Helper缩放
   */
  public setHelperScale(scale: number): void {
    this.helperScale = scale;
    // 注意：RectAreaLightHelper不支持缩放，但保留此方法用于未来扩展
  }

  /**
   * 为指定灯光创建Helper
   */
  public createHelperForLight(id: string): THREE.Object3D | null {
    const light = this.lights.get(id);
    if (!light) {
      console.warn(`Light with id '${id}' not found`);
      return null;
    }

    // 移除已存在的Helper
    this.removeHelperForLight(id);

    let helper: THREE.Object3D | null = null;

    if (light instanceof THREE.RectAreaLight) {
      helper = new RectAreaLightHelper(light);
    } else if (light instanceof THREE.PointLight) {
      helper = new THREE.PointLightHelper(light, this.helperScale);
    } else if (light instanceof THREE.SpotLight) {
      helper = new THREE.SpotLightHelper(light);
    } else if (light instanceof THREE.DirectionalLight) {
      helper = new THREE.DirectionalLightHelper(light, this.helperScale);
    }

    if (helper) {
      helper.visible = this.helpersEnabled;
      this.scene.add(helper);
      this.lightHelpers.set(id, helper);
    }

    return helper;
  }

  /**
   * 移除指定灯光的Helper
   */
  public removeHelperForLight(id: string): void {
    const helper = this.lightHelpers.get(id);
    if (helper) {
      this.scene.remove(helper);
      // 如果是可dispose的对象，调用dispose
      if ('dispose' in helper && typeof helper.dispose === 'function') {
        (helper as any).dispose();
      }
      this.lightHelpers.delete(id);
    }
  }

  /**
   * 为所有灯光创建Helper
   */
  public createAllHelpers(): void {
    // 为自定义灯光创建Helper
    this.lights.forEach((_, id) => {
      this.createHelperForLight(id);
    });

    // 为Studio灯光创建Helper
    this.createStudioLightHelpers();
  }

  /**
   * 创建Studio三点布光的Helper
   */
  private createStudioLightHelpers(): void {
    // 移除现有Helper
    this.removeStudioLightHelpers();

    if (this.keyLight) {
      this.keyLightHelper = new RectAreaLightHelper(this.keyLight);
      this.keyLightHelper.visible = this.helpersEnabled;
      this.scene.add(this.keyLightHelper);
    }

    if (this.fillLight) {
      this.fillLightHelper = new RectAreaLightHelper(this.fillLight);
      this.fillLightHelper.visible = this.helpersEnabled;
      this.scene.add(this.fillLightHelper);
    }

    if (this.rimLight) {
      this.rimLightHelper = new RectAreaLightHelper(this.rimLight);
      this.rimLightHelper.visible = this.helpersEnabled;
      this.scene.add(this.rimLightHelper);
    }
  }

  /**
   * 移除Studio灯光Helper
   */
  private removeStudioLightHelpers(): void {
    if (this.keyLightHelper) {
      this.scene.remove(this.keyLightHelper);
      this.keyLightHelper.dispose();
      this.keyLightHelper = undefined;
    }
    if (this.fillLightHelper) {
      this.scene.remove(this.fillLightHelper);
      this.fillLightHelper.dispose();
      this.fillLightHelper = undefined;
    }
    if (this.rimLightHelper) {
      this.scene.remove(this.rimLightHelper);
      this.rimLightHelper.dispose();
      this.rimLightHelper = undefined;
    }
  }

  /**
   * 移除所有Helper
   */
  public removeAllHelpers(): void {
    // 移除自定义灯光Helper
    this.lightHelpers.forEach((helper) => {
      this.scene.remove(helper);
      if ('dispose' in helper && typeof helper.dispose === 'function') {
        (helper as any).dispose();
      }
    });
    this.lightHelpers.clear();

    // 移除Studio灯光Helper
    this.removeStudioLightHelpers();
  }

  /**
   * 切换指定灯光的Helper显示
   */
  public toggleLightHelper(id: string): boolean {
    const helper = this.lightHelpers.get(id);
    if (helper) {
      helper.visible = !helper.visible;
      return helper.visible;
    }
    return false;
  }

  /**
   * 获取所有灯光Helper信息
   */
  public getAllHelperInfo(): LightHelperInfo[] {
    const info: LightHelperInfo[] = [];

    // 自定义灯光Helper
    this.lightHelpers.forEach((helper, id) => {
      const config = this.lightConfigs.get(id);
      info.push({
        id,
        type: config?.type || 'unknown',
        visible: helper.visible,
      });
    });

    // Studio灯光Helper
    if (this.keyLightHelper) {
      info.push({
        id: 'studio_keyLight',
        type: 'rectAreaLight',
        visible: this.keyLightHelper.visible,
      });
    }
    if (this.fillLightHelper) {
      info.push({
        id: 'studio_fillLight',
        type: 'rectAreaLight',
        visible: this.fillLightHelper.visible,
      });
    }
    if (this.rimLightHelper) {
      info.push({
        id: 'studio_rimLight',
        type: 'rectAreaLight',
        visible: this.rimLightHelper.visible,
      });
    }

    return info;
  }

  /**
   * 获取Helper是否启用
   */
  public getHelpersEnabled(): boolean {
    return this.helpersEnabled;
  }

  /**
   * 获取Studio灯光引用（用于调试）
   */
  public getStudioLights(): {
    keyLight?: THREE.RectAreaLight;
    fillLight?: THREE.RectAreaLight;
    rimLight?: THREE.RectAreaLight;
  } {
    return {
      keyLight: this.keyLight,
      fillLight: this.fillLight,
      rimLight: this.rimLight,
    };
  }

  /**
   * 销毁灯光系统
   */
  public dispose(): void {
    this.removeAllHelpers();
    this.clearAllLights();
    console.log('LightSystem disposed');
  }
}
