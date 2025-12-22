# Implementation Plan: Unified Logging System

**Branch**: `019-unified-logging-system` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-unified-logging-system/spec.md`

## Summary

Implement a unified logging system for both the Tauri (Rust) backend and Next.js (TypeScript) frontend. The system writes structured JSON log entries to files in the app data directory, supports configurable log levels via environment variable (defaulting to WARN for production), includes automatic log rotation and retention, and transports frontend logs to the backend via Tauri IPC for unified file output.

## Technical Context

**Language/Version**: Rust 2021 Edition (backend), TypeScript 5.7.2 (frontend)
**Primary Dependencies**: Tauri 2.x, React 19.0.0, Next.js 16.x, serde/serde_json (Rust), @tauri-apps/api 2.0.0, **tauri-plugin-log 2.x** (Rust), **@tauri-apps/plugin-log** (TS), chrono 0.4 (Rust)
**Storage**: JSON log files in Tauri app data directory (`logs/` subdirectory)
**Testing**: vitest (frontend), cargo test (backend)
**Target Platform**: Windows 11 (64-bit)
**Project Type**: Desktop application (Tauri + Next.js hybrid)
**Performance Goals**: Log writes should not block UI thread; batched/async writes for high-frequency events
**Constraints**: <10ms overhead per log call; log rotation before 10MB; 7-day retention
**Scale/Scope**: Single-user desktop app; typical log volume ~1000-10000 entries per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality
- [x] **Static analysis**: Rust clippy + TypeScript ESLint will validate code
- [x] **Single responsibility**: Logging module isolated from business logic
- [x] **No duplication**: Shared log format between frontend/backend via IPC contract
- [x] **Self-documenting**: Log levels and entry structure are standard patterns

### II. Testing Standards
- [x] **Integration tests**: Will test full logging flow (frontend → IPC → backend → file)
- [x] **Feature coverage**: Tests cover log level filtering, rotation, JSON format
- [x] **Deterministic**: Log tests can use fixed timestamps for reproducibility

### III. User Experience Consistency
- [x] **Predictable behavior**: Logs always go to same location in app data dir
- [x] **Clear feedback**: Console output in dev mode provides immediate visibility
- [x] **Graceful degradation**: Falls back to console if file write fails

### IV. Performance Requirements
- [x] **Performance budget**: <10ms per log operation
- [x] **Resource monitoring**: Log file size monitored for rotation trigger
- [x] **No regression**: Async writes prevent UI blocking

### V. Research-First Development
- [x] **Context7 research**: Researched `tauri-plugin-log` (uses `log` crate) - see research.md
- [x] **Best practices**: JSONL format with ISO 8601 timestamps confirmed - see research.md
- [x] **Tauri patterns**: Plugin handles IPC automatically; 3 custom commands defined - see contracts/

**Gate Status**: PASS (all items resolved)

## Project Structure

### Documentation (this feature)

```text
specs/019-unified-logging-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── logging.rs           # NEW: Rust logging module
├── logging_types.rs     # NEW: Log entry types, config
├── lib.rs               # Modified: Add logging commands to invoke_handler
└── main.rs              # Modified: Initialize logger on startup

src/
├── lib/
│   └── logger.ts        # NEW: Frontend logging service
├── types/
│   └── logging.ts       # NEW: TypeScript log types (mirrors Rust)
└── hooks/
    └── useLogger.ts     # NEW: React hook for component logging
```

**Structure Decision**: Follows existing project patterns - new Rust modules in `src-tauri/src/`, new TypeScript utilities in `src/lib/`, types in `src/types/`. No new directories needed; integrates with existing IPC patterns from persistence module.

## Complexity Tracking

> No violations detected. Implementation follows simplest approach:
> - **Use official Tauri logging plugin** (`tauri-plugin-log`) instead of custom implementation
> - Single log file per session (with rotation)
> - Standard JSON-lines format (no custom serialization)
> - Plugin handles IPC automatically (no custom log commands needed)
> - Environment variable config (no runtime config UI)
> - Only 3 custom commands for maintenance (cleanup, get_config, get_path)

## Key Design Decision

**Research finding**: Tauri provides an official logging plugin that handles 90% of requirements out of the box:
- File logging with rotation ✓
- Log level filtering ✓
- Frontend-to-backend IPC ✓
- Console output ✓
- JSON formatting (with custom formatter) ✓

**Impact**: Significantly reduced implementation scope. Instead of building a logging system from scratch, we configure and extend the existing plugin. Custom code is limited to:
1. Environment variable parsing for log level
2. Custom JSON formatter for structured output
3. Log cleanup command for retention policy
4. Helper TypeScript utilities (useLogger hook, console forwarding)
