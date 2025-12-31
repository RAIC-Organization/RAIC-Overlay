# Research: Header Button Group Separation

**Feature**: 041-header-button-groups
**Date**: 2025-12-31
**Status**: Complete

## Summary

No external research required. This feature uses only existing patterns and components already established in the codebase.

## Findings

### 1. Visual Separator Pattern

**Decision**: Use existing `border-l border-border pl-2` pattern
**Rationale**: Already used in MainMenu.tsx for the Settings section separator (line 149)
**Alternatives considered**: None - consistency with existing UI is required per spec FR-010

### 2. ButtonGroup Component

**Decision**: Use existing `ButtonGroup` component from `@/components/ui/button-group`
**Rationale**: Already imported and used in MainMenu.tsx; supports multiple instances in same row
**Alternatives considered**: None - reusing existing component is the simplest approach

### 3. Code Removal Scope

**Decision**: Remove TestWindowContent.tsx and all references
**Rationale**: Test windows are ephemeral, not persisted, and provide no user value
**Files affected**:
- DELETE: `src/components/windows/TestWindowContent.tsx`
- MODIFY: `src/components/MainMenu.tsx` (remove import and handler)
- MODIFY: `src/types/windows.ts` (remove 'test' from WindowContentType)

### 4. Button Categorization

**Decision**: Apps = [Notes, Draw, Browser, File Viewer], Widgets = [Clock]
**Rationale**:
- Apps create persistent, resizable, draggable windows
- Widgets create lightweight, transparent overlays (clock uses widget system per feature 027)
**Alternatives considered**: None - categorization matches the underlying system architecture

## Dependencies Verified

| Dependency | Version | Status |
|------------|---------|--------|
| ButtonGroup | shadcn/ui | Already in use |
| Button | shadcn/ui | Already in use |
| Tailwind border utilities | 4.x | Already in use |

## Conclusion

No NEEDS CLARIFICATION items. All implementation details are established from existing codebase patterns.
