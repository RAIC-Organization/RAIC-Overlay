import type { WindowRect } from './ipc';

// T005: OverlayMode type for windowed/fullscreen states
export type OverlayMode = 'windowed' | 'fullscreen';

// T009: Extended OverlayState with target binding fields
export interface OverlayState {
  visible: boolean;
  initialized: boolean;
  mode: OverlayMode;
  // T009: Target window binding state
  targetBound: boolean;
  targetName: string;
  targetRect: WindowRect | null;
  autoHidden: boolean;
}

export const initialState: OverlayState = {
  visible: false,
  initialized: false,
  mode: 'windowed',
  targetBound: false,
  targetName: '',
  targetRect: null,
  autoHidden: false,
};
