/**
 * Logging types for the unified logging system
 */

/**
 * Log severity levels matching Rust's log crate
 */
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Log entry structure (for reading logs, not writing)
 */
export interface LogEntry {
  ts: string;      // ISO 8601 timestamp
  level: LogLevel;
  target: string;  // Module/component name
  message: string;
}

/**
 * Result of cleanup_old_logs command
 */
export interface CleanupResult {
  deleted_count: number;  // Number of files deleted
  freed_bytes: number;    // Total bytes freed
  errors: string[];       // Any errors encountered (non-fatal)
}

/**
 * Logging configuration (read-only from frontend)
 */
export interface LogConfig {
  min_level: LogLevel;
  max_file_size: number;     // bytes
  log_dir: string;           // absolute path
  console_output: boolean;
}
