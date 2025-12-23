"use client";

/**
 * useWidgetEvents Hook
 *
 * Subscribes to widget events and integrates them with the WidgetsContext.
 * This hook bridges the event system with the state management layer.
 *
 * @feature 027-widget-container
 */

import { useEffect } from 'react';
import { widgetEvents } from '@/lib/widgetEvents';
import { useWidgets } from '@/contexts/WidgetsContext';

/**
 * Hook that subscribes to widget events and dispatches actions to the context.
 * Should be used in a component that is a child of WidgetsProvider.
 *
 * @example
 * function WidgetsContainer() {
 *   useWidgetEvents();
 *   const { widgets } = useWidgets();
 *   // ... render widgets
 * }
 */
export function useWidgetEvents(): void {
  const { openWidget, closeWidget } = useWidgets();

  useEffect(() => {
    // Subscribe to widget:open events
    const unsubscribeOpen = widgetEvents.on('widget:open', (payload) => {
      openWidget(payload);
    });

    // Subscribe to widget:close events
    const unsubscribeClose = widgetEvents.on('widget:close', ({ widgetId }) => {
      closeWidget(widgetId);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
    };
  }, [openWidget, closeWidget]);
}
