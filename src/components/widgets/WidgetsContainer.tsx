"use client";

/**
 * WidgetsContainer Component
 *
 * Orchestrates rendering of all widgets. Subscribes to widget events
 * and renders Widget components for each widget instance.
 *
 * @feature 027-widget-container
 */

import { useWidgets } from '@/contexts/WidgetsContext';
import { useWidgetEvents } from '@/hooks/useWidgetEvents';
import { Widget } from './Widget';

// ============================================================================
// Props
// ============================================================================

interface WidgetsContainerProps {
  mode: string; // 'windowed' (interactive) or 'fullscreen' (click-through)
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

  const isInteractive = mode === 'windowed';

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
          onMove={moveWidget}
          onResize={resizeWidget}
          onOpacityChange={setWidgetOpacity}
          onFlip={setWidgetFlipped}
          onClose={closeWidget}
        >
          {/* Widget content will be rendered based on type in Phase 3 */}
          <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
            Widget: {widget.type}
          </div>
        </Widget>
      ))}
    </div>
  );
}
