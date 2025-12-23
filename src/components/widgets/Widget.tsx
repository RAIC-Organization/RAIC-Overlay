"use client";

/**
 * Widget Component
 *
 * Base widget container with transparent background and flip animation
 * capability. Widgets have no header/borders and support drag-to-reposition
 * and corner resize in interaction mode.
 *
 * @feature 027-widget-container
 */

import { type ReactNode } from 'react';
import type { WidgetInstance } from '@/types/widgets';

// ============================================================================
// Props
// ============================================================================

interface WidgetProps {
  widget: WidgetInstance;
  isInteractive: boolean;
  children: ReactNode;
  onMove?: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onOpacityChange?: (id: string, opacity: number) => void;
  onFlip?: (id: string, isFlipped: boolean) => void;
  onClose?: (id: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Widget base component - transparent container for widget content.
 * Phase 2 shell - flip animation and drag/resize will be added in later phases.
 */
export function Widget({
  widget,
  isInteractive,
  children,
}: WidgetProps) {
  return (
    <div
      data-widget-id={widget.id}
      className="absolute"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        opacity: widget.opacity,
        // Transparent background - no borders, no header
        background: 'transparent',
        // Disable pointer events in click-through mode
        pointerEvents: isInteractive ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}
