"use client";

/**
 * Window Component
 *
 * Renders a single window with header and content. Supports drag-to-move
 * via header, resize via edges/corners, and click-to-focus z-ordering.
 * Includes open/close animations.
 *
 * @feature 007-windows-system
 */

import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { WindowInstance } from '@/types/windows';
import { WINDOW_CONSTANTS } from '@/types/windows';
import { useWindows } from '@/contexts/WindowsContext';
import { WindowHeader } from './WindowHeader';

interface WindowProps {
  window: WindowInstance;
  onExitComplete?: () => void;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const RESIZE_HANDLE_SIZE = 8;

export function Window({ window: windowInstance, onExitComplete }: WindowProps) {
  const { id, title, component: Component, componentProps, x, y, width, height, zIndex } =
    windowInstance;

  const { focusWindow, resizeWindow, moveWindow } = useWindows();
  const resizeRef = useRef<{
    direction: ResizeDirection;
    startX: number;
    startY: number;
    windowX: number;
    windowY: number;
    windowWidth: number;
    windowHeight: number;
  } | null>(null);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);

  // Handle window focus on click
  const handleWindowClick = useCallback(() => {
    focusWindow(id);
  }, [id, focusWindow]);

  // Get cursor style based on position
  const getCursorStyle = (direction: ResizeDirection): string => {
    switch (direction) {
      case 'n':
      case 's':
        return 'cursor-ns-resize';
      case 'e':
      case 'w':
        return 'cursor-ew-resize';
      case 'ne':
      case 'sw':
        return 'cursor-nesw-resize';
      case 'nw':
      case 'se':
        return 'cursor-nwse-resize';
      default:
        return '';
    }
  };

  // Determine resize direction from pointer position
  const getResizeDirection = (e: React.PointerEvent): ResizeDirection => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const isTop = offsetY < RESIZE_HANDLE_SIZE;
    const isBottom = offsetY > rect.height - RESIZE_HANDLE_SIZE;
    const isLeft = offsetX < RESIZE_HANDLE_SIZE;
    const isRight = offsetX > rect.width - RESIZE_HANDLE_SIZE;

    if (isTop && isLeft) return 'nw';
    if (isTop && isRight) return 'ne';
    if (isBottom && isLeft) return 'sw';
    if (isBottom && isRight) return 'se';
    if (isTop) return 'n';
    if (isBottom) return 's';
    if (isLeft) return 'w';
    if (isRight) return 'e';
    return null;
  };

  // Handle resize pointer down
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    const direction = getResizeDirection(e);
    if (!direction) return;

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      windowX: x,
      windowY: y,
      windowWidth: width,
      windowHeight: height,
    };
    setResizeDirection(direction);
  }, [x, y, width, height]);

  // Handle resize pointer move
  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    // Update cursor based on position when not dragging
    if (!resizeRef.current) {
      const direction = getResizeDirection(e);
      setResizeDirection(direction);
      return;
    }

    const { direction, startX, startY, windowX, windowY, windowWidth, windowHeight } = resizeRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = windowX;
    let newY = windowY;
    let newWidth = windowWidth;
    let newHeight = windowHeight;

    // Calculate new dimensions based on direction
    if (direction?.includes('e')) {
      newWidth = Math.max(WINDOW_CONSTANTS.MIN_WIDTH, windowWidth + deltaX);
    }
    if (direction?.includes('w')) {
      const proposedWidth = windowWidth - deltaX;
      if (proposedWidth >= WINDOW_CONSTANTS.MIN_WIDTH) {
        newWidth = proposedWidth;
        newX = windowX + deltaX;
      }
    }
    if (direction?.includes('s')) {
      newHeight = Math.max(WINDOW_CONSTANTS.MIN_HEIGHT, windowHeight + deltaY);
    }
    if (direction?.includes('n')) {
      const proposedHeight = windowHeight - deltaY;
      if (proposedHeight >= WINDOW_CONSTANTS.MIN_HEIGHT) {
        newHeight = proposedHeight;
        newY = windowY + deltaY;
      }
    }

    requestAnimationFrame(() => {
      if (newX !== windowX || newY !== windowY) {
        moveWindow(id, newX, newY);
      }
      if (newWidth !== windowWidth || newHeight !== windowHeight) {
        resizeWindow(id, newWidth, newHeight);
      }
    });
  }, [id, moveWindow, resizeWindow]);

  // Handle resize pointer up
  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    resizeRef.current = null;
  }, []);

  // Handle pointer leave to reset cursor
  const handlePointerLeave = useCallback(() => {
    if (!resizeRef.current) {
      setResizeDirection(null);
    }
  }, []);

  return (
    <motion.div
      className={`absolute bg-background border border-border rounded-lg shadow-lg overflow-hidden ${getCursorStyle(resizeDirection)}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onPointerDown={handleWindowClick}
      onAnimationComplete={(definition) => {
        if (definition === 'exit' && onExitComplete) {
          onExitComplete();
        }
      }}
    >
      {/* Resize handles - invisible overlay for detecting edge/corner hover */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Header - needs to be inside to capture events */}
        <div className="pointer-events-auto">
          <WindowHeader
            windowId={id}
            title={title}
            x={x}
            y={y}
          />
        </div>

        {/* Content */}
        <div
          className="overflow-auto pointer-events-auto"
          style={{ height: `calc(100% - ${WINDOW_CONSTANTS.HEADER_HEIGHT}px)` }}
        >
          <Component {...(componentProps ?? {})} />
        </div>
      </div>
    </motion.div>
  );
}
