"use client";

/**
 * WidgetsContainer Component
 *
 * Orchestrates rendering of all widgets. Subscribes to widget events
 * and renders Widget components for each widget instance.
 *
 * @feature 027-widget-container
 */

import { useCallback } from 'react';
import { useWidgets } from '@/contexts/WidgetsContext';
import { useWidgetEvents } from '@/hooks/useWidgetEvents';
import { usePersistenceContext } from '@/contexts/PersistenceContext';
import { Widget } from './Widget';
import { ClockWidgetContent } from './ClockWidgetContent';
import { SessionTimerWidgetContent } from './SessionTimerWidgetContent';
import { ChronometerWidgetContent } from './ChronometerWidgetContent';
import type { WidgetInstance, WidgetType } from '@/types/widgets';

// ============================================================================
// Props
// ============================================================================

interface WidgetsContainerProps {
  mode: string; // 'windowed' (interactive) or 'fullscreen' (click-through)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Render widget content based on widget type.
 */
function renderWidgetContent(
  widget: WidgetInstance,
  isInteractive: boolean
): React.ReactNode {
  switch (widget.type as WidgetType) {
    case 'clock':
      return (
        <ClockWidgetContent
          isInteractive={isInteractive}
          widgetId={widget.id}
        />
      );
    case 'timer':
      return (
        <SessionTimerWidgetContent
          isInteractive={isInteractive}
          widgetId={widget.id}
        />
      );
    case 'chronometer':
      return (
        <ChronometerWidgetContent
          isInteractive={isInteractive}
          widgetId={widget.id}
        />
      );
    default:
      // Fallback for unknown widget types
      return (
        <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
          Unknown widget: {widget.type}
        </div>
      );
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Container that manages and renders all widget instances.
 */
export function WidgetsContainer({ mode }: WidgetsContainerProps) {
  // Subscribe to widget events
  useWidgetEvents();

  const {
    widgets,
    moveWidget,
    resizeWidget,
    setWidgetOpacity,
    setWidgetFlipped,
    closeWidget,
  } = useWidgets();

  // Get persistence context (may be null if not in provider)
  const persistence = usePersistenceContext();

  const isInteractive = mode === 'windowed';

  // Wrap move callback to trigger persistence
  const handleMove = useCallback((id: string, x: number, y: number) => {
    moveWidget(id, x, y);
    persistence?.onWidgetMoved();
  }, [moveWidget, persistence]);

  // Wrap resize callback to trigger persistence
  const handleResize = useCallback((id: string, width: number, height: number) => {
    resizeWidget(id, width, height);
    persistence?.onWidgetMoved();
  }, [resizeWidget, persistence]);

  // Wrap opacity callback to trigger persistence
  const handleOpacityChange = useCallback((id: string, opacity: number) => {
    setWidgetOpacity(id, opacity);
    persistence?.onWidgetMoved();
  }, [setWidgetOpacity, persistence]);

  // Wrap close callback to trigger persistence
  const handleClose = useCallback((id: string) => {
    closeWidget(id);
    persistence?.onWidgetMoved();
  }, [closeWidget, persistence]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 50 }} // Above windows but below menus
    >
      {widgets.map((widget) => (
        <Widget
          key={widget.id}
          widget={widget}
          isInteractive={isInteractive}
          onMove={handleMove}
          onResize={handleResize}
          onOpacityChange={handleOpacityChange}
          onFlip={setWidgetFlipped}
          onClose={handleClose}
        >
          {renderWidgetContent(widget, isInteractive)}
        </Widget>
      ))}
    </div>
  );
}
