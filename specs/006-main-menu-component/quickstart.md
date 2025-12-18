# Quickstart: MainMenu Component Implementation

**Feature Branch**: `006-main-menu-component`
**Date**: 2025-12-18

## Prerequisites

- Node.js and pnpm installed
- Repository cloned and on branch `006-main-menu-component`
- Tauri development environment set up

## Step 1: Install shadcn Components

```bash
# Install Button component
pnpm dlx shadcn@latest add button

# Install ButtonGroup component
pnpm dlx shadcn@latest add button-group
```

This adds:
- `src/components/ui/button.tsx`
- `src/components/ui/button-group.tsx`

## Step 2: Create MainMenu Component

Create `src/components/MainMenu.tsx`:

```typescript
"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { OverlayMode } from "@/types/overlay";
import { WindowRect } from "@/types/ipc";

interface MainMenuProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
}

export function MainMenu({
  visible = true,
  mode = "windowed",
  targetRect = null,
}: MainMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const showHideDuration = prefersReducedMotion ? 0 : 0.3;

  // Only show in windowed (interactive) mode
  const shouldShow = visible && mode === "windowed";

  const handleButtonClick = (buttonName: string) => {
    console.log(`Button clicked: ${buttonName}`);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="main-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: showHideDuration, ease: "easeOut" }}
          className="bg-transparent flex justify-center gap-2 p-2"
        >
          {/* Group 1: Option 1 & Option 2 */}
          <ButtonGroup>
            <Button onClick={() => handleButtonClick("Option 1")}>
              Option 1
            </Button>
            <Button onClick={() => handleButtonClick("Option 2")}>
              Option 2
            </Button>
          </ButtonGroup>

          {/* Group 2: Option 3 */}
          <ButtonGroup>
            <Button onClick={() => handleButtonClick("Option 3")}>
              Option 3
            </Button>
          </ButtonGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Step 3: Update HeaderPanel

Add `position` prop to `src/components/HeaderPanel.tsx`:

```typescript
interface HeaderPanelProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
  position?: 'top' | 'bottom';  // Add this
}

export function HeaderPanel({
  visible = true,
  mode = "windowed",
  targetRect = null,
  position = "top",  // Add this
}: HeaderPanelProps) {
  // ... existing code
}
```

Update the container div to handle position (wrap existing return):

```typescript
// In the return, update the container class based on position
<div className={cn(
  "w-full flex justify-center",
  position === "bottom" ? "items-end" : "items-start"
)}>
  {/* existing Card component */}
</div>
```

## Step 4: Update page.tsx Layout

Update `app/page.tsx`:

```typescript
import { MainMenu } from "@/components/MainMenu";

// In the return statement:
return (
  <div className="flex flex-col justify-between h-full">
    {/* MainMenu at top - only visible in interactive mode */}
    <MainMenu
      visible={state.visible}
      mode={state.mode}
      targetRect={state.targetRect}
    />

    {/* Header at bottom when interactive, top otherwise */}
    <HeaderPanel
      visible={state.visible}
      mode={state.mode}
      targetRect={state.targetRect}
      position={state.mode === "windowed" ? "bottom" : "top"}
    />

    {/* Error modal unchanged */}
    <ErrorModal
      visible={errorModal.visible}
      targetName={errorModal.targetName}
      message={errorModal.message}
      autoDismissMs={errorModal.autoDismissMs}
      onDismiss={handleDismissError}
    />
  </div>
);
```

## Step 5: Run and Test

```bash
# Start development server
pnpm tauri:dev

# Test sequence:
# 1. F3 to show overlay
# 2. F5 to toggle to interactive mode - MainMenu should appear at top
# 3. Click buttons - check console for log messages
# 4. F5 to toggle back - MainMenu should disappear
```

## Verification Checklist

- [ ] MainMenu appears when pressing F5 (interactive mode)
- [ ] MainMenu has transparent background
- [ ] Two button groups are visually distinguishable
- [ ] Group 1 contains "Option 1" and "Option 2"
- [ ] Group 2 contains "Option 3"
- [ ] Clicking buttons logs to console
- [ ] Header moves to bottom in interactive mode
- [ ] MainMenu disappears when pressing F5 again (click-through mode)
- [ ] Animations are smooth (~300ms)

## Common Issues

**Buttons not visible**: Ensure shadcn Button component was installed correctly. Check `src/components/ui/button.tsx` exists.

**ButtonGroup not found**: Run `pnpm dlx shadcn@latest add button-group` to install.

**No animation**: Check motion library import path is `motion/react` (not `framer-motion`).

**Layout issues**: Ensure parent container has `h-full` or explicit height for flexbox `justify-between` to work.
