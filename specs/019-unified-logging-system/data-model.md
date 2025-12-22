# Data Model: Unified Logging System

**Feature Branch**: `019-unified-logging-system`
**Date**: 2025-12-22

## Entities

### LogEntry

A single log record written to the log file as a JSON object on one line.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ts` | string (ISO 8601) | Yes | Timestamp when log was created (UTC) |
| `level` | string enum | Yes | Log severity level |
| `target` | string | Yes | Source module/component (e.g., `raic_overlay_lib::persistence`) |
| `message` | string | Yes | Human-readable log message |

**Level Values**: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`

**Example**:
```json
{"ts":"2025-12-22T14:30:00.123Z","level":"INFO","target":"raic_overlay_lib::logging","message":"Application started"}
{"ts":"2025-12-22T14:30:01.456Z","level":"WARN","target":"frontend","message":"Network request timeout"}
{"ts":"2025-12-22T14:30:02.789Z","level":"ERROR","target":"raic_overlay_lib::persistence","message":"Failed to save state: Permission denied"}
```

### LogLevel (Enum)

Severity levels in order of verbosity (most verbose first).

| Value | Numeric | Description |
|-------|---------|-------------|
| `TRACE` | 0 | Very detailed debugging information |
| `DEBUG` | 1 | Debugging information for development |
| `INFO` | 2 | General informational messages |
| `WARN` | 3 | Warning conditions (default production level) |
| `ERROR` | 4 | Error conditions requiring attention |

**Filtering Rule**: A log entry is written only if its level >= configured minimum level.

### LogConfiguration

Runtime configuration read at application startup.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `min_level` | LogLevel | `WARN` | Minimum level to log |
| `log_dir` | path | Platform LogDir | Directory for log files |
| `max_file_size` | bytes | 10,000,000 | Max size before rotation |
| `retention_days` | number | 7 | Days to keep old logs |
| `console_output` | boolean | true if DEBUG/INFO | Also output to stdout |

**Environment Variable**: `RAIC_LOG_LEVEL` sets `min_level`
- Valid values: `DEBUG`, `INFO`, `WARN`, `ERROR`
- Case-insensitive
- Invalid/missing defaults to `WARN`

### LogFile

Physical file storing log entries.

| Attribute | Description |
|-----------|-------------|
| Location | `{app_log_dir}/app.log` (current), `{app_log_dir}/app.log.{N}` (rotated) |
| Format | JSONL (JSON Lines - one JSON object per line) |
| Encoding | UTF-8 |
| Line ending | LF (`\n`) |
| Max size | 10MB before rotation |

**Windows Path Example**: `C:\Users\{user}\AppData\Roaming\RAICOverlay\logs\app.log`

## State Transitions

### Log Level Filtering State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    Log Event Created                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Check: event.level │
                   │  >= config.min_level│
                   └─────────────────────┘
                      │              │
                   Yes│              │No
                      ▼              ▼
              ┌───────────┐   ┌───────────┐
              │Write to   │   │  Discard  │
              │targets    │   │           │
              └───────────┘   └───────────┘
```

### Log File Rotation State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    Write Log Entry                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │Check: file_size >   │
                   │max_file_size        │
                   └─────────────────────┘
                      │              │
                   Yes│              │No
                      ▼              ▼
              ┌───────────────┐  ┌──────────────┐
              │Rotate:        │  │Append to     │
              │app.log →      │  │app.log       │
              │app.log.{N}    │  │              │
              └───────────────┘  └──────────────┘
                      │
                      ▼
              ┌───────────────┐
              │Create new     │
              │app.log        │
              └───────────────┘
```

## Relationships

```
┌─────────────────┐
│ LogConfiguration│
│ (singleton)     │
└────────┬────────┘
         │ configures
         ▼
┌─────────────────┐       writes to      ┌─────────────────┐
│ Logger          │─────────────────────▶│ LogFile         │
│ (singleton)     │                      │ (1 active,      │
└────────┬────────┘                      │  N rotated)     │
         │                               └─────────────────┘
         │ filters & formats
         ▼
┌─────────────────┐
│ LogEntry        │
│ (many)          │
└─────────────────┘
```

## Validation Rules

### LogEntry
- `ts`: Must be valid ISO 8601 format with timezone
- `level`: Must be one of the defined enum values
- `target`: Non-empty string, typically module path
- `message`: Non-empty string, special characters escaped for JSON

### LogConfiguration
- `min_level`: Must be valid LogLevel
- `max_file_size`: Must be > 0, recommended >= 1MB
- `retention_days`: Must be > 0, recommended >= 1

### LogFile
- Must be writable by application
- Parent directory must exist or be creatable
- File name follows pattern: `app.log` or `app.log.{N}` where N is rotation sequence

## Type Definitions

### Rust Types

```rust
// Log levels provided by `log` crate
use log::LevelFilter;

// Configuration parsed at startup
pub struct LogConfig {
    pub min_level: LevelFilter,
    pub max_file_size: u64,
    pub console_output: bool,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            min_level: LevelFilter::Warn,
            max_file_size: 10_000_000,
            console_output: false,
        }
    }
}
```

### TypeScript Types

```typescript
// Log levels matching Rust
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// Log entry structure (for reading logs, not writing)
export interface LogEntry {
  ts: string;      // ISO 8601
  level: LogLevel;
  target: string;
  message: string;
}

// Configuration (read-only from frontend)
export interface LogConfig {
  minLevel: LogLevel;
  maxFileSize: number;
  consoleOutput: boolean;
}
```

## Storage Considerations

### File Size Estimates
- Average log entry: ~150 bytes
- 10MB file ≈ 66,000 entries
- Typical session: 1,000-10,000 entries ≈ 150KB-1.5MB

### Retention Calculation
- 7 days retention
- Worst case: 10 rotations/day = 70 files × 10MB = 700MB max
- Typical case: 1-2 rotations/day = 14 files × 10MB = 140MB

### Performance
- Writes buffered by plugin (async)
- Read access: sequential scan of JSONL (no indexing)
- Rotation: atomic rename operation
