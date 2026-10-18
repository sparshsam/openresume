import { useEffect, useRef } from 'react';

export function useDebouncedEffect(effect: () => void, delayMs: number, deps: unknown[]): void {
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  });

  useEffect(() => {
    const id = window.setTimeout(() => effectRef.current(), delayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs]);
}
