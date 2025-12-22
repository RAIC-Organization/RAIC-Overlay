# Data Model: Background Transparency Persistence Fix

**Feature**: 020-background-transparency-persistence
**Date**: 2025-12-22

## Overview

This is a bug fix feature that requires **no data model changes**. All entities and their fields are already correctly defined in the codebase.

## Existing Entities (No Changes Required)

### WindowStructure (persistence.ts:33-43)

The persisted window structure already includes the `backgroundTransparent` field:

```typescript
export interface WindowStructure {
  id: string;
  type: WindowType;
  position: Position;
  size: Size;
  zIndex: number;
  flags: WindowFlags;
  opacity: number;
  backgroundTransparent: boolean;  // Already exists
}
```

### WindowInstance (windows.ts:154-193)

The runtime window instance already includes the `backgroundTransparent` field:

```typescript
export interface WindowInstance {
  id: string;
  title: string;
  contentType?: WindowContentType;
  component: AnyComponent;
  componentProps?: Record<string, unknown>;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: number;
  opacity: number;
  backgroundTransparent: boolean;  // Already exists
}
```

### PersistedState (persistence.ts:19-24)

The root persisted state structure:

```typescript
export interface PersistedState {
  version: number;
  lastModified: string;
  global: GlobalSettings;
  windows: WindowStructure[];  // Contains backgroundTransparent
}
```

## Serialization (Already Correct)

The `serializeWindow` function in `serialization.ts` already correctly maps `backgroundTransparent`:

```typescript
export function serializeWindow(win: WindowInstance): WindowStructure | null {
  // ...
  return {
    // ...
    backgroundTransparent: win.backgroundTransparent ?? false,
  };
}
```

## State Flow

```text
WindowInstance.backgroundTransparent (runtime)
       ↓
   serializeWindow()
       ↓
WindowStructure.backgroundTransparent (persisted)
       ↓
   state.json
```

The flow is correctly implemented. The bug is in the **timing** of when state is read for serialization, not in the data model itself.

## Validation Rules

| Field | Type | Default | Validation |
|-------|------|---------|------------|
| backgroundTransparent | boolean | false | Must be boolean; defaults to false if missing |

## Migrations

No migrations required. The `backgroundTransparent` field already exists in the schema (version 1).
