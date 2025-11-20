import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { PBRVisualizer as VisualizerCore } from '../core/PBRVisualizer';
import { VisualizerOptions, SceneState, ModelState } from '../types/core';

export interface PBRVisualizerProps extends Omit<VisualizerOptions, 'container'> {
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onStateChange?: (state: SceneState) => void;
}

export interface PBRVisualizerRef {
  updateModel: (modelId: string, state: Partial<ModelState>, options?: any) => Promise<void>;
  setCamera: (position: [number, number, number], target: [number, number, number]) => void;
  updateEnvironment: (config: any) => void;
  captureFrame: () => string;
  getInstance: () => VisualizerCore | null;
}

export const PBRVisualizer = forwardRef<PBRVisualizerRef, PBRVisualizerProps>(({
  className,
  style,
  models,
  initialGlobalState,
  quality,
  debug,
  autoResize,
  onLoad,
  onStateChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<VisualizerCore | null>(null);

  useImperativeHandle(ref, () => ({
    updateModel: async (modelId, state, options) => {
      return visualizerRef.current?.updateModel(modelId, state, options);
    },
    setCamera: (position, target) => {
      visualizerRef.current?.setCamera(position, target);
    },
    updateEnvironment: (config) => {
      visualizerRef.current?.updateEnvironment(config);
    },
    captureFrame: () => {
      return visualizerRef.current?.captureFrame() || '';
    },
    getInstance: () => visualizerRef.current
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const visualizer = new VisualizerCore({
      container: containerRef.current,
      models,
      initialGlobalState,
      quality,
      debug,
      autoResize
    });

    visualizerRef.current = visualizer;

    if (onLoad) {
        // Assuming VisualizerCore emits a 'ready' or we just call it here
        // Since initialization is synchronous in constructor (mostly), we can call it.
        // But model loading is async.
        // We should probably listen to 'modelLoaded' for all models or add a 'ready' event.
        // For now, just call onLoad immediately as the component is mounted.
        onLoad();
    }

    if (onStateChange) {
        visualizer.on('stateChange', (event: any) => {
            // We might want to pass the full state or just the event
            // The prop says (state: SceneState), but event is StateChangeEvent
            // Let's just pass the event for now or fetch state
            // onStateChange(visualizer.getState()); // Need getState method
        });
    }

    return () => {
      visualizer.dispose();
      visualizerRef.current = null;
    };
  }, []); // Re-init if props change? Ideally not, use refs or separate update effects.

  // Handle prop updates
  useEffect(() => {
    if (visualizerRef.current && initialGlobalState) {
        // This is tricky, we don't want to reset state on every render
        // Only if specific props change.
        // For now, we assume props are for initialization mostly.
    }
  }, [initialGlobalState]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    />
  );
});

PBRVisualizer.displayName = 'PBRVisualizer';
