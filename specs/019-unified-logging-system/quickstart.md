# Quickstart: Unified Logging System

**Feature Branch**: `019-unified-logging-system`
**Date**: 2025-12-22

## Overview

This guide shows how to use the unified logging system in RAICOverlay for both Rust backend and TypeScript frontend code.

## Prerequisites

The logging system is initialized automatically when the app starts. No manual setup required in your code.

## Backend Logging (Rust)

### Basic Usage

Use standard `log` crate macros anywhere in Rust code:

```rust
use log::{debug, info, warn, error};

fn some_function() {
    debug!("Detailed debug info: {:?}", some_data);
    info!("Operation completed successfully");
    warn!("Resource usage is high: {}%", usage);
    error!("Failed to connect: {}", error_message);
}
```

### With Structured Data

```rust
info!(target: "persistence", "State saved: {} windows", count);
error!(target: "hotkey", "Failed to register shortcut: {}", key);
```

### Log Levels

| Level | When to Use |
|-------|-------------|
| `error!` | Unrecoverable errors, failures requiring attention |
| `warn!` | Recoverable issues, deprecated usage, edge cases |
| `info!` | Significant events (startup, shutdown, user actions) |
| `debug!` | Development debugging, state changes |
| `trace!` | Very detailed tracing (rarely used) |

## Frontend Logging (TypeScript)

### Basic Usage

Import and use logging functions from the plugin:

```typescript
import { debug, info, warn, error } from '@tauri-apps/plugin-log';

async function handleUserAction() {
  info('User clicked save button');

  try {
    await saveData();
    debug('Data saved successfully');
  } catch (e) {
    error(`Save failed: ${e}`);
  }
}
```

### Forward Console Logs (Optional)

To automatically capture existing `console.*` calls:

```typescript
import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

// Call once at app initialization
function setupConsoleForwarding() {
  const forward = (
    fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
    logger: (message: string) => Promise<void>
  ) => {
    const original = console[fnName];
    console[fnName] = (...args) => {
      original(...args);
      logger(args.map(String).join(' '));
    };
  };

  forward('log', trace);
  forward('debug', debug);
  forward('info', info);
  forward('warn', warn);
  forward('error', error);
}
```

### React Hook (Convenience)

```typescript
// src/hooks/useLogger.ts
import { debug, info, warn, error } from '@tauri-apps/plugin-log';
import { useCallback } from 'react';

export function useLogger(component: string) {
  return {
    debug: useCallback((msg: string) => debug(`[${component}] ${msg}`), [component]),
    info: useCallback((msg: string) => info(`[${component}] ${msg}`), [component]),
    warn: useCallback((msg: string) => warn(`[${component}] ${msg}`), [component]),
    error: useCallback((msg: string) => error(`[${component}] ${msg}`), [component]),
  };
}

// Usage in component:
function MyComponent() {
  const log = useLogger('MyComponent');

  useEffect(() => {
    log.info('Component mounted');
    return () => log.debug('Component unmounted');
  }, []);
}
```

## Configuration

### Set Log Level

Set the `RAIC_LOG_LEVEL` environment variable before starting the app:

**Development (see all logs)**:
```bash
# Windows PowerShell
$env:RAIC_LOG_LEVEL="DEBUG"
npm run tauri:dev

# Windows CMD
set RAIC_LOG_LEVEL=DEBUG
npm run tauri:dev

# Linux/Mac
RAIC_LOG_LEVEL=DEBUG npm run tauri:dev
```

**Production (default - warnings and errors only)**:
```bash
# No env var needed, defaults to WARN
npm run tauri:build
```

### Valid Log Levels

| Value | What Gets Logged |
|-------|------------------|
| `DEBUG` | Everything (debug, info, warn, error) |
| `INFO` | Info and above (info, warn, error) |
| `WARN` | Warnings and errors only (default) |
| `ERROR` | Errors only |

## Log File Location

Logs are stored in the platform-specific app data directory:

**Windows**: `C:\Users\{username}\AppData\Roaming\RAICOverlay\logs\app.log`

### View Logs

```typescript
import { invoke } from '@tauri-apps/api/core';

// Get the log file path
const logPath = await invoke<string>('get_log_file_path');
console.log('Logs at:', logPath);
```

### Log Format

Each line is a JSON object:
```json
{"ts":"2025-12-22T14:30:00.123Z","level":"INFO","target":"frontend","message":"User clicked save"}
{"ts":"2025-12-22T14:30:01.456Z","level":"ERROR","target":"raic_overlay_lib::persistence","message":"Failed to write file"}
```

## Maintenance

### Clean Old Logs

Logs older than 7 days can be cleaned up:

```typescript
import { invoke } from '@tauri-apps/api/core';

interface CleanupResult {
  deleted_count: number;
  freed_bytes: number;
  errors: string[];
}

const result = await invoke<CleanupResult>('cleanup_old_logs');
console.log(`Cleaned ${result.deleted_count} files, freed ${(result.freed_bytes / 1024 / 1024).toFixed(2)} MB`);
```

### Log Rotation

- Log files automatically rotate when they reach 10MB
- Rotated files are named `app.log.1`, `app.log.2`, etc.
- Old rotated files are kept until cleanup is run

## Best Practices

1. **Use appropriate levels**: Don't log everything at INFO level
2. **Include context**: Add relevant IDs, counts, or state info
3. **Avoid sensitive data**: Never log passwords, tokens, or PII
4. **Keep messages concise**: One line per log entry
5. **Use structured format**: Include key-value pairs for searchability

### Good Examples

```typescript
info('Window opened: id=notes-1, type=notes');
warn('State save delayed: queue_size=15');
error(`IPC failed: command=save_state, error=${e.message}`);
```

### Bad Examples

```typescript
// Too vague
info('Something happened');

// Too verbose for INFO
info('Entering function processData with arguments x=1, y=2, z=3...');

// Sensitive data
error(`Login failed for user ${email} with password ${password}`);
```

## Troubleshooting

### Logs Not Appearing

1. Check `RAIC_LOG_LEVEL` is set correctly
2. Verify the log level is high enough (DEBUG shows all)
3. Check log file permissions

### Log File Too Large

1. Run `cleanup_old_logs` command
2. Lower log level in production
3. Check for logging in tight loops

### Frontend Logs Missing

1. Ensure `@tauri-apps/plugin-log` is installed
2. Check browser console for IPC errors
3. Verify plugin is initialized in Rust
