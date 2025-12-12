export interface OverlayState {
  visible: boolean;
  initialized: boolean;
}

export const initialState: OverlayState = {
  visible: false,
  initialized: false,
};
