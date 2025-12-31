# Implementation Plan: Header Button Group Separation

**Branch**: `041-header-button-groups` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/041-header-button-groups/spec.md`

## Summary

Remove the Test Windows button and TestWindowContent component from the codebase, then reorganize the MainMenu button layout to visually separate Apps (Notes, Draw, Browser, File Viewer) from Widgets (Clock) using the existing ButtonGroup component and border separator pattern.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (React 19.0.0 frontend)
**Primary Dependencies**: React 19.0.0, Next.js 16.x, motion 12.x, shadcn/ui (ButtonGroup, Button)
**Storage**: N/A (no persistence changes)
**Testing**: Visual verification (component is UI-only)
**Target Platform**: Windows 11 (64-bit) via Tauri 2.x
**Project Type**: Desktop application (Tauri + React)
**Performance Goals**: N/A (trivial UI reorganization)
**Constraints**: Must match existing visual patterns (border-l border-border separator style)
**Scale/Scope**: 3 files modified, 1 file deleted

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ Pass | Removes unused code (TestWindowContent), improves organization |
| II. Testing Standards | ✅ Pass (Justified Deviation) | UI-only JSX restructuring with no logic changes; manual visual verification per T010-T012 is sufficient. No new components or business logic introduced. |
| III. User Experience Consistency | ✅ Pass | Uses existing separator pattern (border-l border-border) |
| IV. Performance Requirements | ✅ Pass | No performance impact (static UI change) |
| V. Research-First Development | ✅ Pass | No new dependencies, uses existing patterns |

**All gates passed. No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/041-header-button-groups/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal - no unknowns)
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── MainMenu.tsx                    # MODIFY: Reorganize button groups
│   ├── ui/
│   │   ├── button.tsx                  # UNCHANGED
│   │   └── button-group.tsx            # UNCHANGED
│   └── windows/
│       └── TestWindowContent.tsx       # DELETE: Remove unused component
└── types/
    └── windows.ts                      # MODIFY: Remove 'test' from WindowContentType
```

**Structure Decision**: Single project structure. This feature modifies existing files in the established `src/components/` and `src/types/` directories. No new files created.

## Complexity Tracking

> No violations requiring justification. This is a straightforward code removal and UI reorganization.

---

## Phase 0: Research

**Status**: Complete - No unknowns identified

This feature requires no external research. All implementation details are established:

1. **Existing separator pattern**: Already used in MainMenu.tsx (line 149): `border-l border-border pl-2`
2. **ButtonGroup component**: Already available and used for the current single group
3. **WindowContentType**: Already defined in `src/types/windows.ts` (line 150)
4. **TestWindowContent**: Located at `src/components/windows/TestWindowContent.tsx`

No NEEDS CLARIFICATION items exist in the specification.

---

## Phase 1: Design

### Changes Required

#### 1. Delete TestWindowContent.tsx

**File**: `src/components/windows/TestWindowContent.tsx`
**Action**: Delete entire file

#### 2. Modify windows.ts

**File**: `src/types/windows.ts`
**Action**: Remove 'test' from WindowContentType union

**Before** (line 150):
```typescript
export type WindowContentType = 'notes' | 'draw' | 'browser' | 'fileviewer' | 'test';
```

**After**:
```typescript
export type WindowContentType = 'notes' | 'draw' | 'browser' | 'fileviewer';
```

#### 3. Modify MainMenu.tsx

**File**: `src/components/MainMenu.tsx`

**Changes**:
1. Remove import of TestWindowContent (line 20)
2. Remove handleTestWindows function (lines 100-106)
3. Reorganize JSX to split buttons into two ButtonGroups with separator

**New JSX structure** (replacing lines 126-146):
```tsx
{/* Apps: Window-based components */}
<ButtonGroup>
  <Button variant="secondary" onClick={handleOpenNotes}>
    Notes
  </Button>
  <Button variant="secondary" onClick={handleOpenDraw}>
    Draw
  </Button>
  <Button variant="secondary" onClick={handleOpenBrowser}>
    Browser
  </Button>
  <Button variant="secondary" onClick={handleOpenFileViewer}>
    File Viewer
  </Button>
</ButtonGroup>

{/* Widgets: Lightweight overlay components */}
<div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
  <ButtonGroup>
    <Button variant="secondary" onClick={handleOpenClockWidget}>
      Clock
    </Button>
  </ButtonGroup>
</div>
```

### Data Model

No data model changes. This feature only affects UI components and type definitions.

### Contracts

No API contracts. This is a frontend-only UI change.

### Quickstart

After implementation:
1. Run `npm run dev` or `npm run tauri dev`
2. Press F3 to toggle overlay
3. Verify:
   - No "Test Windows" button visible
   - Apps group (Notes, Draw, Browser, File Viewer) on left
   - Visible separator (vertical line)
   - Widgets group (Clock) on right
   - Settings section (Scanlines toggle) remains on far right
