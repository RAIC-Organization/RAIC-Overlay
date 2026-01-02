"use client";

/**
 * Widget Component
 *
 * Base widget container with transparent background and 3D backflip animation
 * capability. Widgets have no header/borders and support immediate drag-to-reposition
 * and corner resize in interaction mode. Double-click triggers a backflip
 * to reveal the settings panel.
 *
 * @feature 027-widget-container
 */

import { useRef, useCallback, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { WidgetInstance } from '@/types/widgets';
import { WIDGET_CONSTANTS } from '@/types/widgets';
import { WidgetSettings } from './WidgetSettings';
import { ChronometerWidgetSettings } from './ChronometerWidgetSettings';

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
 * Supports immediate drag-to-move, corner resize, and
 * 3D backflip animation to reveal settings on double-click.
 */
export function Widget({
  widget,
  isInteractive,
  children,
  onMove,
  onResize,
  onOpacityChange,
  onFlip,
  onClose,
}: WidgetProps) {
  // Drag state - immediate drag, no hold threshold
  const dragRef = useRef<{
    startX: number;
    startY: number;
    widgetX: number;
    widgetY: number;
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

  // Animation state - block interactions during flip
  const [isAnimating, setIsAnimating] = useState(false);

  // ============================================================================
  // Flip Handlers (triggered by double-click)
  // ============================================================================

  const handleFlip = useCallback(() => {
    if (isAnimating || !isInteractive) return;

    setIsAnimating(true);
    onFlip?.(widget.id, !widget.isFlipped);

    // Unblock after animation completes (500ms per SC-004)
    setTimeout(() => {
      setIsAnimating(false);
    }, WIDGET_CONSTANTS.FLIP_DURATION_MS);
  }, [isAnimating, isInteractive, widget.id, widget.isFlipped, onFlip]);

  const handleCloseSettings = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    onFlip?.(widget.id, false);

    setTimeout(() => {
      setIsAnimating(false);
    }, WIDGET_CONSTANTS.FLIP_DURATION_MS);
  }, [isAnimating, widget.id, onFlip]);

  const handleOpacityChange = useCallback((opacity: number) => {
    onOpacityChange?.(widget.id, opacity);
  }, [widget.id, onOpacityChange]);

  const handleCloseWidget = useCallback(() => {
    onClose?.(widget.id);
  }, [widget.id, onClose]);

  // Double-click handler for opening settings
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isInteractive || isAnimating || widget.isFlipped) return;
    e.preventDefault();
    e.stopPropagation();
    handleFlip();
  }, [isInteractive, isAnimating, widget.isFlipped, handleFlip]);

  // ============================================================================
  // Drag Handlers (immediate drag, no hold threshold)
  // ============================================================================

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag when flipped (settings panel is shown)
    if (!isInteractive || isResizing || isAnimating || widget.isFlipped) return;

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

    // Start dragging immediately
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
    };
    setIsDragging(true);
  }, [isInteractive, isResizing, isAnimating, widget.isFlipped, widget.x, widget.y]);

  const handleDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;

    const { startX, startY, widgetX, widgetY } = dragRef.current;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newX = widgetX + deltaX;
    const newY = widgetY + deltaY;

    onMove?.(widget.id, newX, newY);
  }, [widget.id, onMove]);

  const handleDragPointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // ============================================================================
  // Resize Handlers (corner only)
  // ============================================================================

  const handleResizePointerDown = useCallback((e: React.PointerEvent, direction: ResizeDirection) => {
    if (!isInteractive || !direction || isAnimating) return;

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
  }, [isInteractive, isAnimating, widget.x, widget.y, widget.width, widget.height]);

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

    if (newX !== widgetX || newY !== widgetY) {
      onMove?.(widget.id, newX, newY);
    }
    if (newWidth !== widgetWidth || newHeight !== widgetHeight) {
      onResize?.(widget.id, newWidth, newHeight);
    }
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
        return isDragging ? 'cursor-grabbing' : 'cursor-grab';
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
        // Transparent background - no borders, no header
        background: 'transparent',
        // Enable pointer events in interactive mode
        pointerEvents: isInteractive ? 'auto' : 'none',
        // 3D perspective for flip animation
        perspective: '1000px',
      }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Flip container with 3D transform */}
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: widget.isFlipped ? 180 : 0,
        }}
        transition={{
          duration: WIDGET_CONSTANTS.FLIP_DURATION_MS / 1000,
          ease: 'easeInOut',
        }}
      >
        {/* Front face - widget content */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: widget.opacity,
          }}
        >
          {children}
        </div>

        {/* Back face - settings panel */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: widget.opacity,
          }}
        >
          {/* Render chronometer-specific settings for chronometer widgets */}
          {widget.type === 'chronometer' ? (
            <ChronometerWidgetSettings
              widgetId={widget.id}
              opacity={widget.opacity}
              onOpacityChange={handleOpacityChange}
              onClose={handleCloseSettings}
              onCloseWidget={handleCloseWidget}
            />
          ) : (
            <WidgetSettings
              widgetId={widget.id}
              opacity={widget.opacity}
              onOpacityChange={handleOpacityChange}
              onClose={handleCloseSettings}
              onCloseWidget={handleCloseWidget}
            />
          )}
        </div>
      </motion.div>

      {/* Corner resize handles - visible only in interactive mode and not flipped */}
      {isInteractive && !widget.isFlipped && (
        <>
          {/* NW Corner */}
          <div
            className="absolute top-0 left-0 cursor-nwse-resize z-10"
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
            className="absolute top-0 right-0 cursor-nesw-resize z-10"
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
            className="absolute bottom-0 left-0 cursor-nesw-resize z-10"
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
            className="absolute bottom-0 right-0 cursor-nwse-resize z-10"
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
