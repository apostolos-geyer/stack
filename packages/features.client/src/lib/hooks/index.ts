"use client";

import { useRef, useCallback } from "react";

/**
 * Returns true only on the first render, then always false.
 * Useful for conditional logic that should only run once during initial render.
 */
export function useFirstRender() {
  const isFirst = useRef(true);
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return false;
}

/**
 * Returns a check() function that returns true the first time it's called,
 * then false forever. Useful for one-time animations or effects.
 */
export function useOnce() {
  const hasRun = useRef(false);

  const check = useCallback(() => {
    if (hasRun.current) return false;
    hasRun.current = true;
    return true;
  }, []);

  return { check };
}
