"use client";

/**
 * useWindowEvents Hook
 *
 * Subscribes to window events and integrates them with the WindowsContext.
 * This hook bridges the event system with the state management layer.
 * Also injects persistence callbacks for content changes.
 *
 * @feature 007-windows-system
 * @feature 010-state-persistence-system
 */

import { useEffect, useRef, useCallback } from 'react';
import { windowEvents } from '@/lib/windowEvents';
import { useWindows } from '@/contexts/WindowsContext';
import { usePersistenceContext } from '@/contexts/PersistenceContext';
import type { WindowOpenPayload } from '@/types/windows';

/**
 * Hook that subscribes to window events and dispatches actions to the context.
 * Should be used in a component that is a child of WindowsProvider and PersistenceProvider.
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
  const persistence = usePersistenceContext();
  const persistenceRef = useRef(persistence);
  persistenceRef.current = persistence;

  // Wrap openWindow to inject persistence callbacks
  const openWindowWithPersistence = useCallback((payload: WindowOpenPayload): string => {
    const windowId = payload.windowId ?? `win_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

    // Inject persistence callbacks based on content type
    const enhancedPayload: WindowOpenPayload = {
      ...payload,
      windowId,
      componentProps: {
        ...payload.componentProps,
      },
    };

    // Add content change callback for notes windows
    if (payload.contentType === 'notes' && persistenceRef.current) {
      enhancedPayload.componentProps = {
        ...enhancedPayload.componentProps,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onContentChange: (content: any) => {
          persistenceRef.current?.onNotesContentChange(windowId, content);
        },
      };
    }

    // Add content change callback for draw windows
    if (payload.contentType === 'draw' && persistenceRef.current) {
      enhancedPayload.componentProps = {
        ...enhancedPayload.componentProps,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onContentChange: (elements: any[], appState: any) => {
          persistenceRef.current?.onDrawContentChange(windowId, elements, appState);
        },
      };
    }

    return openWindow(enhancedPayload);
  }, [openWindow]);

  useEffect(() => {
    // Subscribe to window:open events
    const unsubscribeOpen = windowEvents.on('window:open', (payload) => {
      openWindowWithPersistence(payload);
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
  }, [openWindowWithPersistence, closeWindow, focusWindow]);
}
