/**
 * Debounce Utility for State Persistence System
 *
 * Provides a debounce function with cancel and flush support
 * for use with persistence triggers.
 *
 * @feature 010-state-persistence-system
 */

/**
 * Creates a debounced version of a function that delays execution
 * until after `delay` milliseconds have elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced function with cancel and flush methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastArgs: any[] | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  }) as T & { cancel: () => void; flush: () => void };

  /**
   * Cancel any pending debounced call.
   */
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
  };

  /**
   * Immediately execute the pending debounced call (if any).
   * This is useful for ensuring saves complete before app closes.
   */
  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}
