"use client";

/**
 * useWindowEvents Hook
 *
 * Subscribes to window events and integrates them with the WindowsContext.
 * This hook bridges the event system with the state management layer.
 *
 * @feature 007-windows-system
 */

import { useEffect } from 'react';
import { windowEvents } from '@/lib/windowEvents';
import { useWindows } from '@/contexts/WindowsContext';

/**
 * Hook that subscribes to window events and dispatches actions to the context.
 * Should be used in a component that is a child of WindowsProvider.
 *
 * @example
 * function WindowsContainer() {
 *   useWindowEvents();
 *   const { windows } = useWindows();
 *   // ... render windows
 * }
 */
export function useWindowEvents(): void {
  const { openWindow, closeWindow, focusWindow } = useWindows();

  useEffect(() => {
    // Subscribe to window:open events
    const unsubscribeOpen = windowEvents.on('window:open', (payload) => {
      openWindow(payload);
    });

    // Subscribe to window:close events
    const unsubscribeClose = windowEvents.on('window:close', ({ windowId }) => {
      closeWindow(windowId);
    });

    // Subscribe to window:focus events
    const unsubscribeFocus = windowEvents.on('window:focus', ({ windowId }) => {
      focusWindow(windowId);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeFocus();
    };
  }, [openWindow, closeWindow, focusWindow]);
}
