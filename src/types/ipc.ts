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

export interface OverlayStateResponse {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
}

// T006: ModeChangePayload for mode-changed event
export interface ModeChangePayload {
  previousMode: OverlayMode;
  currentMode: OverlayMode;
}
