/**
 * Frontend logging service that forwards logs to the Tauri backend.
 * Uses @tauri-apps/plugin-log for IPC transport.
 */
import {
  trace as logTrace,
  debug as logDebug,
  info as logInfo,
  warn as logWarn,
  error as logError,
} from '@tauri-apps/plugin-log';

/**
 * Log a trace-level message (most verbose)
 */
export const trace = (message: string): Promise<void> => logTrace(message);

/**
 * Log a debug-level message
 */
export const debug = (message: string): Promise<void> => logDebug(message);

/**
 * Log an info-level message
 */
export const info = (message: string): Promise<void> => logInfo(message);

/**
 * Log a warning-level message
 */
export const warn = (message: string): Promise<void> => logWarn(message);

/**
 * Log an error-level message
 */
export const error = (message: string): Promise<void> => logError(message);

/**
 * Forward console.* calls to the logging system.
 * Call once at app initialization to capture all console output.
 */
export function forwardConsole(): void {
  const forward = (
    fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
    logger: (message: string) => Promise<void>
  ): void => {
    const original = console[fnName];
    console[fnName] = (...args: unknown[]) => {
      original.apply(console, args);
      const message = args.map((arg) => String(arg)).join(' ');
      logger(`[console.${fnName}] ${message}`).catch(() => {
        // Silently ignore logging failures to prevent infinite loops
      });
    };
  };

  forward('log', trace);
  forward('debug', debug);
  forward('info', info);
  forward('warn', warn);
  forward('error', error);
}
