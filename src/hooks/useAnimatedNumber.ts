import { useEffect, useRef, useState } from 'react';

const DURATION = 700;

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const useAnimatedNumber = (target: number): number => {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const from = valueRef.current;
    if (from === target) return;

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION, 1);
      const current = from + (target - from) * easeOutCubic(progress);
      valueRef.current = current;
      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return value;
};
