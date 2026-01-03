# Research: Ko-fi Button Replacement

**Feature**: 056-kofi-button
**Date**: 2026-01-03

## Summary

This feature requires minimal research as the user provided the complete Ko-fi embed code with all necessary specifications.

## Decisions

### D1: Ko-fi Button URL

**Decision**: Use `https://ko-fi.com/Y8Y01QVRYF`
**Rationale**: User-provided URL directly from Ko-fi embed code
**Alternatives considered**: None - user specified exact URL

### D2: Ko-fi Image Source

**Decision**: Use `https://storage.ko-fi.com/cdn/kofi3.png?v=6`
**Rationale**: Official Ko-fi CDN URL from user-provided embed code
**Alternatives considered**:
- Self-hosting the image: Rejected - adds maintenance burden and may violate Ko-fi branding guidelines
- Alternative Ko-fi button styles: Not requested by user

### D3: Button Height

**Decision**: 36 pixels (matching `height='36'` from embed code)
**Rationale**: Matches Ko-fi's official embed specifications
**Alternatives considered**: None - explicit specification from embed code

### D4: Implementation Approach

**Decision**: Modify existing `handleOpenBuyMeCoffee` function and button JSX in SettingsPanel.tsx
**Rationale**:
- Existing infrastructure (tauri-plugin-opener) already handles external URL opening
- Same button container styling can be reused
- Minimal code change follows constitution's simplicity principle
**Alternatives considered**:
- Creating a separate component: Rejected - over-engineering for a single-use button
- Adding configuration option: Rejected - not requested, YAGNI principle

## Existing Code Analysis

Reviewed `src/components/settings/SettingsPanel.tsx`:
- Lines 75-82: `handleOpenBuyMeCoffee` function - needs URL update only
- Lines 237-247: Button JSX - needs image src and alt text update
- Uses `openUrl` from `@tauri-apps/plugin-opener` - no changes needed

## No Research Required

The following items require no additional research:
- tauri-plugin-opener: Already installed and working for Buy Me A Coffee button
- React patterns: Existing button patterns in codebase are sufficient
- Styling: Current styling (hover opacity, centered layout) will be preserved
