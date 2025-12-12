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
}
