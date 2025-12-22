# Research: Unified Logging System

**Feature Branch**: `019-unified-logging-system`
**Date**: 2025-12-22

## Executive Summary

Research confirms that Tauri provides an **official logging plugin** (`tauri-plugin-log`) that satisfies all core requirements with minimal custom implementation. The plugin handles file logging, rotation, log levels, and frontend-to-backend transport via IPC automatically.

## Decision 1: Rust Logging Framework

**Decision**: Use `tauri-plugin-log` (which uses the `log` crate internally)

**Rationale**:
- Official Tauri plugin with first-class support
- Handles file persistence, rotation, and multi-target output
- Provides both Rust and TypeScript APIs
- Uses standard `log` crate macros (`info!`, `warn!`, `error!`, `debug!`)
- Already integrates with Tauri's IPC for frontend logging

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| `tracing` crate | More powerful but overkill for this use case; requires custom subscriber setup |
| Custom implementation | Reinventing the wheel; plugin already exists |
| `log` crate alone | Would require manual file handling, rotation, and IPC setup |

**Source**: [Tauri Logging Plugin Documentation](https://v2.tauri.app/plugin/logging)

## Decision 2: Log File Location and Rotation

**Decision**: Use `LogDir` target with `KeepAll` rotation strategy

**Rationale**:
- `LogDir` uses platform-standard log directory (e.g., `%APPDATA%\RAICOverlay\logs` on Windows)
- `KeepAll` rotation preserves old logs (vs. discarding)
- `max_file_size` configurable (will use 10MB per spec)
- File cleanup can be implemented via scheduled task or manual deletion

**Configuration**:
```rust
tauri_plugin_log::Builder::new()
    .target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::LogDir {
            file_name: Some("app".to_string()),
        },
    ))
    .max_file_size(10_000_000) // 10MB
    .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
    .build()
```

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Custom folder path | LogDir follows platform conventions automatically |
| `KeepOne` rotation | Would lose historical logs needed for debugging |

## Decision 3: Log Level Configuration

**Decision**: Read from environment variable, default to `Warn`

**Rationale**:
- Plugin supports `.level(log::LevelFilter::X)` for global level
- Environment variable `RAIC_LOG_LEVEL` parsed at startup
- Production default `Warn` ensures minimal noise while capturing issues

**Implementation**:
```rust
fn get_log_level() -> log::LevelFilter {
    std::env::var("RAIC_LOG_LEVEL")
        .ok()
        .and_then(|s| match s.to_uppercase().as_str() {
            "DEBUG" => Some(log::LevelFilter::Debug),
            "INFO" => Some(log::LevelFilter::Info),
            "WARN" => Some(log::LevelFilter::Warn),
            "ERROR" => Some(log::LevelFilter::Error),
            _ => None,
        })
        .unwrap_or(log::LevelFilter::Warn)
}
```

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Runtime config file | Over-engineering; env var is simpler |
| Tauri config key | Less flexible than env var for dev/prod switching |

## Decision 4: Frontend Logging Transport

**Decision**: Use `@tauri-apps/plugin-log` TypeScript package with console forwarding

**Rationale**:
- Plugin provides `trace`, `debug`, `info`, `warn`, `error` functions
- Automatically transports to Rust backend via IPC
- Can forward existing `console.*` calls to the logging system
- Zero custom IPC commands needed

**Implementation**:
```typescript
import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

// Forward console.* to logger
function forwardConsole(
  fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logger: (message: string) => Promise<void>
) {
  const original = console[fnName];
  console[fnName] = (message) => {
    original(message);
    logger(message);
  };
}

forwardConsole('log', trace);
forwardConsole('debug', debug);
forwardConsole('info', info);
forwardConsole('warn', warn);
forwardConsole('error', error);
```

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Custom IPC command | Plugin already provides this |
| Frontend-only logging | Wouldn't persist to file |

## Decision 5: Log Format

**Decision**: Use plugin's default format with custom formatter for JSON output

**Rationale**:
- Plugin supports custom `format()` function
- Can output structured JSON per line for machine parsing
- Includes timestamp, level, target (source), and message

**Implementation**:
```rust
tauri_plugin_log::Builder::new()
    .format(|out, message, record| {
        out.finish(format_args!(
            r#"{{"ts":"{}","level":"{}","target":"{}","message":"{}"}}"#,
            chrono::Utc::now().to_rfc3339(),
            record.level(),
            record.target(),
            message.to_string().replace('"', r#"\""#)
        ))
    })
    .build()
```

**Note**: Requires adding `chrono` crate for ISO 8601 timestamps.

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Plain text format | Less machine-parseable; spec requires JSON |
| `serde_json` serialization | Adds complexity; simple format_args! sufficient |

## Decision 6: Console Output in Development

**Decision**: Add `Stdout` target when log level is DEBUG or INFO

**Rationale**:
- Developers need immediate console visibility during development
- Plugin supports multiple targets simultaneously
- Production (WARN default) won't have console noise

**Implementation**:
```rust
let mut builder = tauri_plugin_log::Builder::new()
    .level(log_level)
    .target(/* LogDir config */);

if log_level <= log::LevelFilter::Info {
    builder = builder.target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::Stdout,
    ));
}

builder.build()
```

## Decision 7: Log Retention Cleanup

**Decision**: Implement manual cleanup function (not automatic scheduler)

**Rationale**:
- Plugin doesn't provide automatic cleanup by date
- A simple Tauri command can delete files older than 7 days
- Called on app startup or via user action
- Avoids complexity of background scheduler

**Implementation approach**:
```rust
#[tauri::command]
fn cleanup_old_logs(app: tauri::AppHandle) -> Result<u32, String> {
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let cutoff = std::time::SystemTime::now() - std::time::Duration::from_secs(7 * 24 * 60 * 60);
    let mut deleted = 0;
    // Iterate and delete files older than cutoff
    Ok(deleted)
}
```

**Alternatives Considered**:
| Alternative | Reason Rejected |
|-------------|-----------------|
| Background scheduler | Over-engineering for desktop app |
| Never cleanup | Would exhaust disk over time |

## Dependencies to Add

### Rust (src-tauri/Cargo.toml)
```toml
tauri-plugin-log = "2"
chrono = "0.4"  # For ISO 8601 timestamps
```

### TypeScript (package.json)
```bash
npm install @tauri-apps/plugin-log
```

### Tauri Config (tauri.conf.json)
```json
{
  "plugins": {
    "log": {}
  }
}
```

## Resolved NEEDS CLARIFICATION Items

| Item | Resolution |
|------|------------|
| Rust logging crate | Use `tauri-plugin-log` (wraps `log` crate) |
| JSON format standards | JSONL (one JSON object per line) with ISO 8601 timestamps |
| Tauri IPC patterns | Plugin handles IPC automatically; no custom commands for logging |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Plugin doesn't support env var config | Wrap plugin init in function that reads env var first |
| JSON escaping edge cases | Use proper string escaping in format function |
| Log file permissions on Windows | Plugin uses standard Tauri paths with correct permissions |
| High-frequency logging performance | Plugin buffers writes internally; async by design |

## Next Steps

1. **Phase 1**: Define data model for log entry structure
2. **Phase 1**: Create IPC contracts (minimal - mostly plugin-provided)
3. **Phase 1**: Generate quickstart guide for using the logger
