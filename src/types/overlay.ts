// T005: OverlayMode type for windowed/fullscreen states
export type OverlayMode = 'windowed' | 'fullscreen';

export interface OverlayState {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
}

export const initialState: OverlayState = {
  visible: false,
  initialized: false,
  mode: 'windowed',
};
