/**
 * React hook for component-level logging.
 * Prefixes all log messages with the component name.
 */
import { useCallback } from 'react';
import { trace, debug, info, warn, error } from '@/lib/logger';

export interface Logger {
  trace: (message: string) => void;
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Create a logger for a specific component.
 * All log messages will be prefixed with [ComponentName].
 *
 * @param component - The component name to use as prefix
 * @returns Logger functions with component prefix
 *
 * @example
 * function MyComponent() {
 *   const log = useLogger('MyComponent');
 *
 *   useEffect(() => {
 *     log.info('Component mounted');
 *     return () => log.debug('Component unmounted');
 *   }, [log]);
 * }
 */
export function useLogger(component: string): Logger {
  return {
    trace: useCallback(
      (msg: string) => {
        trace(`[${component}] ${msg}`);
      },
      [component]
    ),
    debug: useCallback(
      (msg: string) => {
        debug(`[${component}] ${msg}`);
      },
      [component]
    ),
    info: useCallback(
      (msg: string) => {
        info(`[${component}] ${msg}`);
      },
      [component]
    ),
    warn: useCallback(
      (msg: string) => {
        warn(`[${component}] ${msg}`);
      },
      [component]
    ),
    error: useCallback(
      (msg: string) => {
        error(`[${component}] ${msg}`);
      },
      [component]
    ),
  };
}
