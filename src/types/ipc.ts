import type { OverlayMode } from './overlay';

export interface OverlayReadyPayload {
  windowId: string;
  position: {
    x: number;
    y: number;
  };
}

export interface SetVisibilityParams {
  visible: boolean;
}

// T008: WindowRect for target window position/size
export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// T008: TargetWindowError types
export type TargetWindowError =
  | { type: 'NotFound'; pattern: string }
  | { type: 'NotFocused' }
  | { type: 'InvalidHandle' };

// T008: TargetWindowStatus for target window state
export interface TargetWindowStatus {
  bound: boolean;
  targetName: string;
  rect: WindowRect | null;
  error: TargetWindowError | null;
}

// T009: Updated OverlayStateResponse with target binding fields
export interface OverlayStateResponse {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
  // T009: Extended fields for target window binding
  targetBound: boolean;
  targetName: string;
  targetRect: WindowRect | null;
  autoHidden: boolean;
}

// T006: ModeChangePayload for mode-changed event
export interface ModeChangePayload {
  previousMode: OverlayMode;
  currentMode: OverlayMode;
}

// T008: TargetWindowChangedPayload for target-window-changed event
export interface TargetWindowChangedPayload {
  bound: boolean;
  focused: boolean;
  rect: WindowRect | null;
}

// T008: ShowErrorModalPayload for show-error-modal event
export interface ShowErrorModalPayload {
  targetName: string;
  message: string;
  autoDismissMs: number;
}

// T008: AutoHideChangedPayload for auto-hide-changed event
export interface AutoHideChangedPayload {
  autoHidden: boolean;
  reason: 'focus_lost' | 'focus_gained' | 'target_closed';
}

// T008: TargetWindowInfo for get_target_window_info command response
export interface TargetWindowInfo {
  pattern: string;
  found: boolean;
  focused: boolean;
  rect: WindowRect | null;
}
