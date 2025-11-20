import { useRef, useEffect } from 'react';
import { PBRVisualizer } from '../core/PBRVisualizer';

export function useVisualizer(visualizerInstance: PBRVisualizer | null) {
  const ref = useRef<PBRVisualizer | null>(visualizerInstance);

  useEffect(() => {
    ref.current = visualizerInstance;
  }, [visualizerInstance]);

  return ref.current;
}
