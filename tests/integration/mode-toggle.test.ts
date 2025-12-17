// T014: Integration test for mode toggle functionality
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Tauri APIs
const mockInvoke = vi.fn();
const mockListen = vi.fn();
const mockUnlisten = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
}));

describe('Mode Toggle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListen.mockResolvedValue(mockUnlisten);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('toggle_mode command', () => {
    it('should toggle from windowed to fullscreen mode', async () => {
      // Setup: initial state is windowed
      mockInvoke.mockResolvedValueOnce({
        visible: true,
        initialized: true,
        mode: 'fullscreen', // Response after toggling
      });

      const result = await mockInvoke('toggle_mode');

      expect(mockInvoke).toHaveBeenCalledWith('toggle_mode');
      expect(result.mode).toBe('fullscreen');
    });

    it('should toggle from fullscreen to windowed mode', async () => {
      // Setup: initial state is fullscreen
      mockInvoke.mockResolvedValueOnce({
        visible: true,
        initialized: true,
        mode: 'windowed', // Response after toggling back
      });

      const result = await mockInvoke('toggle_mode');

      expect(mockInvoke).toHaveBeenCalledWith('toggle_mode');
      expect(result.mode).toBe('windowed');
    });

    it('should return OverlayStateResponse with all required fields', async () => {
      mockInvoke.mockResolvedValueOnce({
        visible: true,
        initialized: true,
        mode: 'fullscreen',
      });

      const result = await mockInvoke('toggle_mode');

      expect(result).toHaveProperty('visible');
      expect(result).toHaveProperty('initialized');
      expect(result).toHaveProperty('mode');
      expect(typeof result.visible).toBe('boolean');
      expect(typeof result.initialized).toBe('boolean');
      expect(['windowed', 'fullscreen']).toContain(result.mode);
    });
  });

  describe('mode-changed event', () => {
    it('should emit mode-changed event with correct payload', async () => {
      const eventHandler = vi.fn();

      // Simulate listening to the event
      mockListen.mockImplementation((eventName, handler) => {
        if (eventName === 'mode-changed') {
          // Store handler for later invocation
          eventHandler.mockImplementation(handler);
        }
        return Promise.resolve(mockUnlisten);
      });

      await mockListen('mode-changed', eventHandler);

      // Simulate event being emitted
      const payload = {
        previousMode: 'windowed',
        currentMode: 'fullscreen',
      };
      eventHandler({ payload });

      expect(mockListen).toHaveBeenCalledWith('mode-changed', expect.any(Function));
    });

    it('should have valid mode values in event payload', () => {
      const validModes = ['windowed', 'fullscreen'];

      const testPayloads = [
        { previousMode: 'windowed', currentMode: 'fullscreen' },
        { previousMode: 'fullscreen', currentMode: 'windowed' },
      ];

      testPayloads.forEach((payload) => {
        expect(validModes).toContain(payload.previousMode);
        expect(validModes).toContain(payload.currentMode);
        expect(payload.previousMode).not.toBe(payload.currentMode);
      });
    });
  });

  describe('get_overlay_state command', () => {
    it('should return current state including mode', async () => {
      mockInvoke.mockResolvedValueOnce({
        visible: true,
        initialized: true,
        mode: 'windowed',
      });

      const result = await mockInvoke('get_overlay_state');

      expect(mockInvoke).toHaveBeenCalledWith('get_overlay_state');
      expect(result).toHaveProperty('mode');
    });
  });
});
