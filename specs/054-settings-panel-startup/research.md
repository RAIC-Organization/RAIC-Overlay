# Research: Settings Panel Startup Behavior

**Feature**: 054-settings-panel-startup
**Date**: 2026-01-03

## Executive Summary

This feature extends the existing user settings infrastructure with a single boolean field. No new technologies or patterns are required. All implementation follows established patterns from feature 038-settings-panel.

## Research Items

### 1. Settings Persistence Pattern

**Question**: How are user settings currently persisted and loaded?

**Findings**:
- Settings stored in `user-settings.json` in Tauri app data directory
- Rust module `user_settings.rs` handles file I/O with atomic write pattern
- Settings cached in `RwLock<Option<UserSettings>>` for fast access
- `init_user_settings()` called in `lib.rs` setup to initialize cache on startup
- TypeScript types mirror Rust types for IPC serialization

**Decision**: Use existing persistence infrastructure - add `start_minimized: bool` field to `UserSettings` struct

**Rationale**: Existing infrastructure handles all edge cases (missing file, corruption, atomic writes). No benefit to introducing new patterns.

**Alternatives Considered**:
- Separate settings file for startup preferences → Rejected (unnecessary complexity)
- Environment variable → Rejected (not user-configurable via UI)

### 2. Settings Window Opening Pattern

**Question**: How is the Settings window currently opened?

**Findings**:
- `settings_window.rs` contains `open_settings_window()` Tauri command
- Uses `WebviewWindowBuilder` to create window if not exists
- Window labeled "settings" with specific size (450x570) and styling
- If window exists, focuses it instead of creating duplicate
- Currently only called from tray menu click

**Decision**: Call `open_settings_window()` from `lib.rs` setup after `init_user_settings()`, conditional on `start_minimized` being false

**Rationale**: Reuses existing window creation logic. Avoids code duplication.

**Alternatives Considered**:
- Create window in tauri.conf.json → Rejected (no conditional logic possible)
- Frontend-initiated window open → Rejected (adds delay, frontend may not be ready)

### 3. Serde Default Field Pattern

**Question**: How should the new field be added to maintain backward compatibility with existing settings files?

**Findings**:
- Rust's serde supports `#[serde(default)]` attribute for optional fields
- `default_chronometer_start_pause()` and `default_chronometer_reset()` show existing pattern
- TypeScript types use `DEFAULT_USER_SETTINGS` constant with all default values

**Decision**: Add `#[serde(default)]` attribute to `start_minimized` field with default `false`

**Rationale**: Ensures existing user-settings.json files without the field load correctly with sensible default.

**Alternatives Considered**:
- Version migration → Rejected (overkill for boolean addition)
- Optional field (Option<bool>) → Rejected (unnecessary complexity)

### 4. Checkbox Component Pattern

**Question**: What UI pattern is used for toggle/checkbox settings?

**Findings**:
- `AutoStartToggle.tsx` provides existing pattern for boolean settings
- Uses shadcn/ui Switch component with label
- State managed in parent `SettingsPanel.tsx` and passed via props
- Save button triggers persistence, not immediate save

**Decision**: Create `StartMinimizedToggle.tsx` following `AutoStartToggle.tsx` pattern

**Rationale**: Consistent UX and code structure. Users familiar with existing toggles.

**Alternatives Considered**:
- Custom checkbox → Rejected (inconsistent with existing UI)
- Immediate save on toggle → Rejected (inconsistent with other settings)

## Dependencies Analysis

| Dependency | Version | Purpose | Notes |
|------------|---------|---------|-------|
| serde | existing | Rust serialization | Already used |
| tauri | 2.x | Window management | Already used |
| React | 19.0.0 | UI components | Already used |
| shadcn/ui | existing | Switch component | Already used |

**No new dependencies required.**

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing settings file missing new field | High | Low | Use serde default attribute |
| Settings window fails to open | Low | Medium | Log error, app continues in tray |
| Performance impact on startup | Low | Low | Single boolean read is negligible |

## Conclusion

All research items resolved. Feature uses 100% existing patterns with minimal additions. Ready for Phase 1 design.
