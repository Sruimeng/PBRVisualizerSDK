import GUI from 'lil-gui';
import type { DebugConfig, DebugState, LightHelperInfo, PerformanceStats } from '../types';
import { SSAOOutputMode } from '../types';
import type { LightSystem } from './LightSystem';
import type { PostProcessSystem } from './PostProcessSystem';

/**
 * 调试系统
 *
 * 负责：
 * - 统一管理调试功能
 * - 灯光Helper可视化
 * - 渲染Buffer可视化
 * - 调试UI面板（lil-gui）
 * - 性能监控集成
 */
export class DebugSystem {
  private lightSystem: LightSystem;
  private postProcessSystem: PostProcessSystem;

  // 配置
  private config: DebugConfig;
  private isEnabled = false;

  // lil-gui 面板
  private gui: GUI | null = null;
  private container: HTMLElement;

  // UI控制对象（用于lil-gui绑定）
  private uiControls = {
    // 灯光Helper
    showLightHelpers: false,
    // Buffer可视化
    bufferMode: SSAOOutputMode.Default,
    bufferModeLabel: '默认（合成）',
    // 后处理
    ssaoEnabled: true,
    bloomEnabled: false,
    // 性能信息（只读）
    fps: 0,
    drawCalls: 0,
    triangles: 0,
  };

  // 性能统计获取器
  private getPerformanceStats: () => PerformanceStats;

  constructor(
    lightSystem: LightSystem,
    postProcessSystem: PostProcessSystem,
    container: HTMLElement,
    getPerformanceStats: () => PerformanceStats,
    initialConfig?: Partial<DebugConfig>,
  ) {
    this.lightSystem = lightSystem;
    this.postProcessSystem = postProcessSystem;
    this.container = container;
    this.getPerformanceStats = getPerformanceStats;

    // 初始化默认配置
    this.config = this.getDefaultConfig();

    // 合并用户配置
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
    }

    // 如果配置启用，则初始化
    if (this.config.enabled) {
      this.enable();
    }

    console.log('DebugSystem initialized');
  }

  /**
   * 获取默认调试配置
   */
  private getDefaultConfig(): DebugConfig {
    return {
      enabled: false,
      showPanel: true,
      lightHelpers: {
        enabled: false,
        scale: 1.0,
      },
      bufferVisualization: {
        enabled: false,
        mode: SSAOOutputMode.Default,
      },
      performance: {
        showStats: true,
      },
    };
  }

  /**
   * 启用调试模式
   */
  public enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.config.enabled = true;

    // 创建UI面板
    if (this.config.showPanel) {
      this.createDebugPanel();
    }

    // 应用初始配置
    this.applyConfig();

    console.log('Debug mode enabled');
  }

  /**
   * 禁用调试模式
   */
  public disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.config.enabled = false;

    // 隐藏所有Helper
    this.lightSystem.setHelpersEnabled(false);

    // 重置Buffer可视化
    this.postProcessSystem.resetOutputMode();

    // 销毁UI面板
    this.destroyDebugPanel();

    console.log('Debug mode disabled');
  }

  /**
   * 切换调试模式
   */
  public toggle(): boolean {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }

  /**
   * 应用配置
   */
  private applyConfig(): void {
    // 应用灯光Helper配置
    if (this.config.lightHelpers.enabled) {
      this.lightSystem.createAllHelpers();
      this.lightSystem.setHelpersEnabled(true);
      this.lightSystem.setHelperScale(this.config.lightHelpers.scale);
    }

    // 应用Buffer可视化配置
    if (this.config.bufferVisualization.enabled) {
      this.postProcessSystem.setSSAOOutputMode(this.config.bufferVisualization.mode);
    }
  }

  /**
   * 创建调试UI面板
   */
  private createDebugPanel(): void {
    if (this.gui) return;

    this.gui = new GUI({
      title: '🔧 调试面板',
      container: this.container,
      width: 280,
    });

    // 同步UI控制对象状态
    this.syncUIControls();

    // 灯光Helper文件夹
    this.createLightHelpersFolder();

    // Buffer可视化文件夹
    this.createBufferVisualizationFolder();

    // 后处理文件夹
    this.createPostProcessFolder();

    // 性能信息文件夹
    if (this.config.performance.showStats) {
      this.createPerformanceFolder();
    }

    // 开始性能更新循环
    this.startPerformanceUpdate();
  }

  /**
   * 同步UI控制对象与当前状态
   */
  private syncUIControls(): void {
    this.uiControls.showLightHelpers = this.config.lightHelpers.enabled;
    this.uiControls.bufferMode = this.config.bufferVisualization.mode;
    this.uiControls.bufferModeLabel = this.getBufferModeName(this.config.bufferVisualization.mode);

    const postProcessConfig = this.postProcessSystem.getCurrentConfig();
    this.uiControls.ssaoEnabled = postProcessConfig.ssao.enabled;
    this.uiControls.bloomEnabled = postProcessConfig.bloom.enabled;
  }

  /**
   * 创建灯光Helper文件夹
   */
  private createLightHelpersFolder(): void {
    if (!this.gui) return;

    const folder = this.gui.addFolder('💡 灯光Helper');

    folder
      .add(this.uiControls, 'showLightHelpers')
      .name('显示Helper')
      .onChange((value: boolean) => {
        this.setLightHelpersEnabled(value);
      });

    folder.open();
  }

  /**
   * 创建Buffer可视化文件夹
   */
  private createBufferVisualizationFolder(): void {
    if (!this.gui) return;

    const folder = this.gui.addFolder('🖼️ Buffer可视化');

    // 创建模式选项
    const modeOptions = {
      '默认（合成）': SSAOOutputMode.Default,
      SSAO纹理: SSAOOutputMode.SSAO,
      模糊SSAO: SSAOOutputMode.Blur,
      深度Buffer: SSAOOutputMode.Depth,
      法线Buffer: SSAOOutputMode.Normal,
    };

    folder
      .add(this.uiControls, 'bufferMode', modeOptions)
      .name('显示模式')
      .onChange((value: SSAOOutputMode) => {
        this.setBufferVisualizationMode(value);
      });

    // 添加快速切换按钮
    folder.add({ cycle: () => this.cycleBufferMode() }, 'cycle').name('切换下一模式');

    folder.add({ reset: () => this.resetBufferMode() }, 'reset').name('重置为默认');

    folder.open();
  }

  /**
   * 创建后处理文件夹
   */
  private createPostProcessFolder(): void {
    if (!this.gui) return;

    const folder = this.gui.addFolder('✨ 后处理');

    folder
      .add(this.uiControls, 'ssaoEnabled')
      .name('SSAO')
      .onChange((value: boolean) => {
        this.postProcessSystem.toggleSSAO(value);
      });

    folder
      .add(this.uiControls, 'bloomEnabled')
      .name('Bloom')
      .onChange((value: boolean) => {
        this.postProcessSystem.toggleBloom(value);
      });

    folder.open();
  }

  /**
   * 创建性能信息文件夹
   */
  private createPerformanceFolder(): void {
    if (!this.gui) return;

    const folder = this.gui.addFolder('📊 性能');

    folder.add(this.uiControls, 'fps').name('FPS').listen().disable();
    folder.add(this.uiControls, 'drawCalls').name('DrawCalls').listen().disable();
    folder.add(this.uiControls, 'triangles').name('三角形').listen().disable();

    folder.open();
  }

  /**
   * 开始性能更新循环
   */
  private startPerformanceUpdate(): void {
    const update = () => {
      if (!this.isEnabled || !this.gui) return;

      const stats = this.getPerformanceStats();
      this.uiControls.fps = Math.round(stats.fps);
      this.uiControls.drawCalls = stats.drawCalls;
      this.uiControls.triangles = stats.triangles;

      requestAnimationFrame(update);
    };

    update();
  }

  /**
   * 销毁调试UI面板
   */
  private destroyDebugPanel(): void {
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }
  }

  /**
   * 获取Buffer模式名称
   */
  private getBufferModeName(mode: SSAOOutputMode): string {
    const names: Record<SSAOOutputMode, string> = {
      [SSAOOutputMode.Default]: '默认（合成）',
      [SSAOOutputMode.SSAO]: 'SSAO纹理',
      [SSAOOutputMode.Blur]: '模糊SSAO',
      [SSAOOutputMode.Depth]: '深度Buffer',
      [SSAOOutputMode.Normal]: '法线Buffer',
    };
    return names[mode] || '未知';
  }

  // ========================
  // 公共API
  // ========================

  /**
   * 设置灯光Helper显示
   */
  public setLightHelpersEnabled(enabled: boolean): void {
    this.config.lightHelpers.enabled = enabled;
    this.uiControls.showLightHelpers = enabled;

    if (enabled) {
      this.lightSystem.createAllHelpers();
    }
    this.lightSystem.setHelpersEnabled(enabled);
  }

  /**
   * 设置Buffer可视化模式
   */
  public setBufferVisualizationMode(mode: SSAOOutputMode): void {
    this.config.bufferVisualization.mode = mode;
    this.config.bufferVisualization.enabled = mode !== SSAOOutputMode.Default;
    this.uiControls.bufferMode = mode;
    this.uiControls.bufferModeLabel = this.getBufferModeName(mode);

    this.postProcessSystem.setSSAOOutputMode(mode);
  }

  /**
   * 切换到下一个Buffer模式
   */
  public cycleBufferMode(): SSAOOutputMode {
    const nextMode = this.postProcessSystem.cycleOutputMode();
    this.config.bufferVisualization.mode = nextMode;
    this.uiControls.bufferMode = nextMode;
    this.uiControls.bufferModeLabel = this.getBufferModeName(nextMode);
    return nextMode;
  }

  /**
   * 重置Buffer模式
   */
  public resetBufferMode(): void {
    this.setBufferVisualizationMode(SSAOOutputMode.Default);
  }

  /**
   * 获取调试状态
   */
  public getState(): DebugState {
    return {
      enabled: this.isEnabled,
      activeLightHelpers: this.lightSystem.getAllHelperInfo().map((h) => h.id),
      bufferMode: this.config.bufferVisualization.mode,
      panelVisible: this.gui !== null,
    };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): DebugConfig {
    return { ...this.config };
  }

  /**
   * 设置配置
   */
  public setConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.enabled !== undefined) {
      if (config.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    }

    if (this.isEnabled) {
      this.applyConfig();
      this.syncUIControls();
    }
  }

  /**
   * 获取所有灯光Helper信息
   */
  public getLightHelperInfo(): LightHelperInfo[] {
    return this.lightSystem.getAllHelperInfo();
  }

  /**
   * 显示/隐藏UI面板
   */
  public setPanelVisible(visible: boolean): void {
    if (visible && !this.gui && this.isEnabled) {
      this.createDebugPanel();
    } else if (!visible && this.gui) {
      this.destroyDebugPanel();
    }
    this.config.showPanel = visible;
  }

  /**
   * 切换UI面板显示
   */
  public togglePanel(): boolean {
    const newVisible = !this.gui;
    this.setPanelVisible(newVisible);
    return newVisible;
  }

  /**
   * 是否已启用
   */
  public get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 销毁调试系统
   */
  public dispose(): void {
    this.disable();
    this.destroyDebugPanel();
    console.log('DebugSystem disposed');
  }
}
