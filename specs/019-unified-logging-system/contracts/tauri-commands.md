# Tauri IPC Commands: Unified Logging System

**Feature Branch**: `019-unified-logging-system`
**Date**: 2025-12-22

## Overview

Most logging functionality is provided by the `tauri-plugin-log` which handles IPC automatically. This document defines the **additional custom commands** needed for features not covered by the plugin.

## Plugin-Provided Functions (No Custom Implementation)

The `@tauri-apps/plugin-log` package provides these functions automatically:

| Function | Description | Rust Equivalent |
|----------|-------------|-----------------|
| `trace(message)` | Log at TRACE level | `log::trace!()` |
| `debug(message)` | Log at DEBUG level | `log::debug!()` |
| `info(message)` | Log at INFO level | `log::info!()` |
| `warn(message)` | Log at WARN level | `log::warn!()` |
| `error(message)` | Log at ERROR level | `log::error!()` |
| `attachConsole()` | Forward Rust logs to browser console | N/A |
| `attachLogger(fn)` | Custom log handler | N/A |

**No custom IPC commands needed for basic logging.**

---

## Custom Commands

### 1. cleanup_old_logs

Deletes log files older than the retention period.

**Command Name**: `cleanup_old_logs`

**Direction**: Frontend → Backend

**Parameters**: None

**Returns**:
```typescript
interface CleanupResult {
  deleted_count: number;  // Number of files deleted
  freed_bytes: number;    // Total bytes freed
  errors: string[];       // Any errors encountered (non-fatal)
}
```

**Rust Signature**:
```rust
#[tauri::command]
async fn cleanup_old_logs(app: tauri::AppHandle) -> Result<CleanupResult, String>
```

**Behavior**:
1. Get app log directory from Tauri
2. List all files matching `app.log.*` pattern
3. Check each file's modification time
4. Delete files older than 7 days
5. Return summary

**Error Handling**:
- Directory not found: Returns error string
- Permission denied on individual file: Logs warning, continues, adds to errors array
- All operations are non-blocking

**Example Usage**:
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<CleanupResult>('cleanup_old_logs');
console.log(`Deleted ${result.deleted_count} old log files, freed ${result.freed_bytes} bytes`);
```

---

### 2. get_log_config

Returns current logging configuration (read-only).

**Command Name**: `get_log_config`

**Direction**: Frontend → Backend

**Parameters**: None

**Returns**:
```typescript
interface LogConfig {
  min_level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  max_file_size: number;     // bytes
  log_dir: string;           // absolute path
  console_output: boolean;
}
```

**Rust Signature**:
```rust
#[tauri::command]
fn get_log_config(state: tauri::State<'_, LogConfigState>) -> LogConfig
```

**Behavior**:
1. Return current configuration from app state
2. No side effects

**Example Usage**:
```typescript
import { invoke } from '@tauri-apps/api/core';

const config = await invoke<LogConfig>('get_log_config');
console.log(`Current log level: ${config.min_level}`);
console.log(`Log directory: ${config.log_dir}`);
```

---

### 3. get_log_file_path

Returns the path to the current active log file.

**Command Name**: `get_log_file_path`

**Direction**: Frontend → Backend

**Parameters**: None

**Returns**:
```typescript
string  // Absolute path to current log file
```

**Rust Signature**:
```rust
#[tauri::command]
fn get_log_file_path(app: tauri::AppHandle) -> Result<String, String>
```

**Behavior**:
1. Get app log directory from Tauri
2. Return path to `app.log`

**Example Usage**:
```typescript
import { invoke } from '@tauri-apps/api/core';

const logPath = await invoke<string>('get_log_file_path');
// Can be used to open in file explorer or display to user
```

---

## Type Definitions

### Rust Types (src-tauri/src/logging_types.rs)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
    pub deleted_count: u32,
    pub freed_bytes: u64,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum LogLevelName {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    pub min_level: LogLevelName,
    pub max_file_size: u64,
    pub log_dir: String,
    pub console_output: bool,
}
```

### TypeScript Types (src/types/logging.ts)

```typescript
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface CleanupResult {
  deleted_count: number;
  freed_bytes: number;
  errors: string[];
}

export interface LogConfig {
  min_level: LogLevel;
  max_file_size: number;
  log_dir: string;
  console_output: boolean;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `LOG_DIR_NOT_FOUND` | Could not determine log directory |
| `LOG_DIR_NOT_READABLE` | Permission denied reading log directory |
| `LOG_FILE_DELETE_FAILED` | Could not delete specific log file |

---

## Sequence Diagrams

### Log Entry Flow (Plugin-Handled)

```
Frontend                    Plugin IPC              Rust Backend            Log File
    │                           │                        │                      │
    │  info("User logged in")   │                        │                      │
    │─────────────────────────▶│                        │                      │
    │                           │   invoke log command   │                      │
    │                           │───────────────────────▶│                      │
    │                           │                        │  check level filter  │
    │                           │                        │─────────┐            │
    │                           │                        │◀────────┘            │
    │                           │                        │  format JSON entry   │
    │                           │                        │─────────┐            │
    │                           │                        │◀────────┘            │
    │                           │                        │  append to file      │
    │                           │                        │─────────────────────▶│
    │                           │       Ok(())           │                      │
    │◀──────────────────────────│◀──────────────────────│                      │
```

### Cleanup Flow (Custom Command)

```
Frontend                              Rust Backend                    File System
    │                                      │                              │
    │  invoke('cleanup_old_logs')          │                              │
    │─────────────────────────────────────▶│                              │
    │                                      │  list log files              │
    │                                      │─────────────────────────────▶│
    │                                      │◀─────────────────────────────│
    │                                      │                              │
    │                                      │  for each old file:          │
    │                                      │    delete file               │
    │                                      │─────────────────────────────▶│
    │                                      │◀─────────────────────────────│
    │                                      │                              │
    │  CleanupResult                       │                              │
    │◀─────────────────────────────────────│                              │
```
