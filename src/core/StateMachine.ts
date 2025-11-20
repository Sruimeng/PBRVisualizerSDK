import * as THREE from 'three';
import { SceneState, StateTransaction, TransitionOptions } from '../types/core';

export class StateMachine {
  private states: Record<string, SceneState> = {};
  private history: StateTransaction[] = [];
  private currentStateId: string | null = null;
  private maxHistorySize = 50;

  constructor(initialState?: SceneState) {
    if (initialState) {
      this.registerState('initial', initialState);
      this.currentStateId = 'initial';
    }
  }

  registerState(id: string, state: SceneState): void {
    this.states[id] = JSON.parse(JSON.stringify(state)); // 深拷贝
  }

  async applyState(id: string, options: TransitionOptions = { duration: 0 }): Promise<void> {
    if (!this.states[id]) {
      throw new Error(`State '${id}' not found`);
    }

    const previousState = this.getCurrentState();
    const newState = this.states[id];

    // 记录状态事务
    const transaction: StateTransaction = {
      id: this.generateId(),
      timestamp: Date.now(),
      previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : this.createEmptyState(),
      newState: JSON.parse(JSON.stringify(newState))
    };

    this.history.push(transaction);
    this.currentStateId = id;

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // 如果有过渡动画，这里可以添加动画逻辑
    if (options.duration > 0) {
      await this.animateTransition(previousState, newState, options);
    }
  }

  updateModelState(modelId: string, state: Partial<SceneState['models'][string]>): void {
    const currentState = this.getCurrentState();
    if (!currentState) return;

    if (!currentState.models[modelId]) {
      currentState.models[modelId] = this.createDefaultModelState();
    }

    // 更新模型状态
    Object.assign(currentState.models[modelId], state);

    // 创建新的事务记录
    const transaction: StateTransaction = {
      id: this.generateId(),
      timestamp: Date.now(),
      previousState: JSON.parse(JSON.stringify(currentState)),
      newState: JSON.parse(JSON.stringify(currentState))
    };

    this.history.push(transaction);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  async batchUpdate(updates: Array<{ modelId: string; state: Partial<SceneState['models'][string]> }>, options: { duration: number; description?: string }): Promise<void> {
    const currentState = this.getCurrentState();
    if (!currentState) return;

    const previousState = JSON.parse(JSON.stringify(currentState));

    // 批量更新模型状态
    updates.forEach(({ modelId, state }) => {
      if (!currentState.models[modelId]) {
        currentState.models[modelId] = this.createDefaultModelState();
      }
      Object.assign(currentState.models[modelId], state);
    });

    // 创建事务记录
    const transaction: StateTransaction = {
      id: this.generateId(),
      timestamp: Date.now(),
      previousState,
      newState: JSON.parse(JSON.stringify(currentState)),
      description: options.description
    };

    this.history.push(transaction);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // 执行过渡动画
    if (options.duration > 0) {
      await new Promise(resolve => setTimeout(resolve, options.duration));
    }
  }

  undo(): boolean {
    if (this.history.length < 2) return false;

    const lastTransaction = this.history[this.history.length - 2];
    const currentTransaction = this.history[this.history.length - 1];

    // 恢复到上一个状态
    const restoredState = JSON.parse(JSON.stringify(lastTransaction.newState));
    this.registerState(`undo_${Date.now()}`, restoredState);
    this.currentStateId = `undo_${Date.now()}`;

    // 移除最后一个事务（当前状态）
    this.history.pop();

    return true;
  }

  redo(): boolean {
    // 简单的重做实现，可以根据需要改进
    return false;
  }

  serialize(): string {
    const currentState = this.getCurrentState();
    if (!currentState) {
      throw new Error('No state to serialize');
    }

    return JSON.stringify({
      version: '1.0',
      timestamp: Date.now(),
      state: currentState
    });
  }

  getCurrentState(): SceneState | null {
    if (!this.currentStateId) return null;
    return this.states[this.currentStateId] || null;
  }

  getHistory(): StateTransaction[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  private createEmptyState(): SceneState {
    return {
      global: {
        environment: {
          sphere: { radius: 0.8, pulse: false }
        },
        camera: {
          position: new THREE.Vector3(3, 2, 5),
          target: new THREE.Vector3(0, 0.5, 0),
          fov: 45,
          near: 0.1,
          far: 1000,
          controls: {
            enabled: true,
            autoRotate: false,
            autoRotateSpeed: 1.0
          }
        },
        postProcessing: {
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
          },
          ssao: {
            enabled: false,
            kernelRadius: 0,
            minDistance: 0,
            maxDistance: 0
          }
        },
        sceneSettings: {
          exposure: 1.0,
          gamma: 2.2,
          toneMapping: THREE.ACESFilmicToneMapping
        }
      },
      models: {}
    };
  }

  private createDefaultModelState(): SceneState['models'][string] {
    return {
      visible: true,
      transform: {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1)
      },
      materials: {},
      animations: {
        enabled: false,
        currentAnimation: 0,
        speed: 1.0,
        loop: true,
        playing: false
      }
    };
  }

  private generateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async animateTransition(from: SceneState | null, to: SceneState, options: TransitionOptions): Promise<void> {
    // 这里可以实现平滑过渡动画
    // 目前只是简单的延迟
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, options.duration);
    });
  }
}
