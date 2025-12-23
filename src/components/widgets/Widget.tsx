"use client";

/**
 * Widget Component
 *
 * Base widget container with transparent background and flip animation
 * capability. Widgets have no header/borders and support drag-to-reposition
 * (after 175ms hold to distinguish from click) and corner resize in
 * interaction mode.
 *
 * @feature 027-widget-container
 */

import { useRef, useCallback, useState, type ReactNode } from 'react';
import type { WidgetInstance } from '@/types/widgets';
import { WIDGET_CONSTANTS } from '@/types/widgets';

// ============================================================================
// Types
// ============================================================================

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | null;

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
// Constants
// ============================================================================

const CORNER_SIZE = 16; // Size of corner hit area
const CORNER_ACCENT_SIZE = 8; // Visual accent size

// ============================================================================
// Component
// ============================================================================

/**
 * Widget base component - transparent container for widget content.
 * Supports drag-to-move (after hold threshold) and corner resize.
 */
export function Widget({
  widget,
  isInteractive,
  children,
  onMove,
  onResize,
}: WidgetProps) {
  // Drag state
  const dragRef = useRef<{
    startX: number;
    startY: number;
    widgetX: number;
    widgetY: number;
    isDragging: boolean;
    holdTimeoutId: ReturnType<typeof setTimeout> | null;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Resize state
  const resizeRef = useRef<{
    direction: ResizeDirection;
    startX: number;
    startY: number;
    widgetX: number;
    widgetY: number;
    widgetWidth: number;
    widgetHeight: number;
  } | null>(null);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [isResizing, setIsResizing] = useState(false);

  // ============================================================================
  // Drag Handlers (with 175ms hold threshold)
  // ============================================================================

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isInteractive || isResizing) return;

    // Don't start drag from corner resize areas
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const isCorner =
      (offsetX < CORNER_SIZE && offsetY < CORNER_SIZE) || // NW
      (offsetX > rect.width - CORNER_SIZE && offsetY < CORNER_SIZE) || // NE
      (offsetX < CORNER_SIZE && offsetY > rect.height - CORNER_SIZE) || // SW
      (offsetX > rect.width - CORNER_SIZE && offsetY > rect.height - CORNER_SIZE); // SE

    if (isCorner) return;

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Start hold threshold timer
    const holdTimeoutId = setTimeout(() => {
      if (dragRef.current) {
        dragRef.current.isDragging = true;
        setIsDragging(true);
      }
    }, WIDGET_CONSTANTS.HOLD_THRESHOLD_MS);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
      isDragging: false,
      holdTimeoutId,
    };
  }, [isInteractive, isResizing, widget.x, widget.y]);

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;

    const { startX, startY, widgetX, widgetY, isDragging: isDrag } = dragRef.current;

    // Only move if hold threshold passed
    if (!isDrag) {
      // Check if moved too far before threshold - cancel drag
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 5 || dy > 5) {
        // Too much movement before hold threshold - this is a click/swipe, not a drag
        if (dragRef.current.holdTimeoutId) {
          clearTimeout(dragRef.current.holdTimeoutId);
        }
        dragRef.current = null;
        return;
      }
      return;
    }

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newX = widgetX + deltaX;
    const newY = widgetY + deltaY;

    requestAnimationFrame(() => {
      onMove?.(widget.id, newX, newY);
    });
  }, [widget.id, onMove]);

  const handleDragPointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (dragRef.current?.holdTimeoutId) {
      clearTimeout(dragRef.current.holdTimeoutId);
    }
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // ============================================================================
  // Resize Handlers (corner only)
  // ============================================================================

  const getResizeDirection = useCallback((e: React.PointerEvent): ResizeDirection => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (offsetX < CORNER_SIZE && offsetY < CORNER_SIZE) return 'nw';
    if (offsetX > rect.width - CORNER_SIZE && offsetY < CORNER_SIZE) return 'ne';
    if (offsetX < CORNER_SIZE && offsetY > rect.height - CORNER_SIZE) return 'sw';
    if (offsetX > rect.width - CORNER_SIZE && offsetY > rect.height - CORNER_SIZE) return 'se';

    return null;
  }, []);

  const handleResizePointerDown = useCallback((e: React.PointerEvent, direction: ResizeDirection) => {
    if (!isInteractive || !direction) return;

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
      widgetWidth: widget.width,
      widgetHeight: widget.height,
    };
    setResizeDirection(direction);
    setIsResizing(true);
  }, [isInteractive, widget.x, widget.y, widget.width, widget.height]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeRef.current) return;

    const { direction, startX, startY, widgetX, widgetY, widgetWidth, widgetHeight } = resizeRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = widgetX;
    let newY = widgetY;
    let newWidth = widgetWidth;
    let newHeight = widgetHeight;

    // Calculate new dimensions based on corner
    if (direction === 'se') {
      newWidth = Math.max(WIDGET_CONSTANTS.MIN_WIDTH, widgetWidth + deltaX);
      newHeight = Math.max(WIDGET_CONSTANTS.MIN_HEIGHT, widgetHeight + deltaY);
    } else if (direction === 'sw') {
      const proposedWidth = widgetWidth - deltaX;
      if (proposedWidth >= WIDGET_CONSTANTS.MIN_WIDTH) {
        newWidth = proposedWidth;
        newX = widgetX + deltaX;
      }
      newHeight = Math.max(WIDGET_CONSTANTS.MIN_HEIGHT, widgetHeight + deltaY);
    } else if (direction === 'ne') {
      newWidth = Math.max(WIDGET_CONSTANTS.MIN_WIDTH, widgetWidth + deltaX);
      const proposedHeight = widgetHeight - deltaY;
      if (proposedHeight >= WIDGET_CONSTANTS.MIN_HEIGHT) {
        newHeight = proposedHeight;
        newY = widgetY + deltaY;
      }
    } else if (direction === 'nw') {
      const proposedWidth = widgetWidth - deltaX;
      if (proposedWidth >= WIDGET_CONSTANTS.MIN_WIDTH) {
        newWidth = proposedWidth;
        newX = widgetX + deltaX;
      }
      const proposedHeight = widgetHeight - deltaY;
      if (proposedHeight >= WIDGET_CONSTANTS.MIN_HEIGHT) {
        newHeight = proposedHeight;
        newY = widgetY + deltaY;
      }
    }

    requestAnimationFrame(() => {
      if (newX !== widgetX || newY !== widgetY) {
        onMove?.(widget.id, newX, newY);
      }
      if (newWidth !== widgetWidth || newHeight !== widgetHeight) {
        onResize?.(widget.id, newWidth, newHeight);
      }
    });
  }, [widget.id, onMove, onResize]);

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    resizeRef.current = null;
    setResizeDirection(null);
    setIsResizing(false);
  }, []);

  // ============================================================================
  // Cursor and visual state
  // ============================================================================

  const getCursorStyle = (dir: ResizeDirection): string => {
    switch (dir) {
      case 'ne':
      case 'sw':
        return 'cursor-nesw-resize';
      case 'nw':
      case 'se':
        return 'cursor-nwse-resize';
      default:
        return isDragging ? 'cursor-grabbing' : 'cursor-move';
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      data-widget-id={widget.id}
      className={`absolute ${isInteractive ? getCursorStyle(resizeDirection) : ''}`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        opacity: widget.opacity,
        // Transparent background - no borders, no header
        background: 'transparent',
        // Enable pointer events in interactive mode
        pointerEvents: isInteractive ? 'auto' : 'none',
      }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
    >
      {/* Content */}
      {children}

      {/* Corner resize handles - visible only in interactive mode */}
      {isInteractive && (
        <>
          {/* NW Corner */}
          <div
            className="absolute top-0 left-0 cursor-nwse-resize"
            style={{ width: CORNER_SIZE, height: CORNER_SIZE }}
            onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          >
            <div
              className="absolute top-0 left-0 border-l-2 border-t-2 border-blue-500/70"
              style={{ width: CORNER_ACCENT_SIZE, height: CORNER_ACCENT_SIZE }}
            />
          </div>

          {/* NE Corner */}
          <div
            className="absolute top-0 right-0 cursor-nesw-resize"
            style={{ width: CORNER_SIZE, height: CORNER_SIZE }}
            onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          >
            <div
              className="absolute top-0 right-0 border-r-2 border-t-2 border-blue-500/70"
              style={{ width: CORNER_ACCENT_SIZE, height: CORNER_ACCENT_SIZE }}
            />
          </div>

          {/* SW Corner */}
          <div
            className="absolute bottom-0 left-0 cursor-nesw-resize"
            style={{ width: CORNER_SIZE, height: CORNER_SIZE }}
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          >
            <div
              className="absolute bottom-0 left-0 border-l-2 border-b-2 border-blue-500/70"
              style={{ width: CORNER_ACCENT_SIZE, height: CORNER_ACCENT_SIZE }}
            />
          </div>

          {/* SE Corner */}
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize"
            style={{ width: CORNER_SIZE, height: CORNER_SIZE }}
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          >
            <div
              className="absolute bottom-0 right-0 border-r-2 border-b-2 border-blue-500/70"
              style={{ width: CORNER_ACCENT_SIZE, height: CORNER_ACCENT_SIZE }}
            />
          </div>
        </>
      )}
    </div>
  );
}
