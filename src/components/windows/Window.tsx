"use client";

/**
 * Window Component
 *
 * Renders a single window with header and content. Supports drag-to-move
 * via header, resize via edges/corners, and click-to-focus z-ordering.
 * Includes open/close animations and mode-aware styling.
 * Triggers persistence on resize completion.
 *
 * In interactive mode (windowed): Header visible with opacity slider, border, drag/resize enabled
 * In passive mode (fullscreen): Header hidden, subtle border, drag/resize disabled
 * Opacity is consistent across both modes (controlled via slider in interactive mode)
 * Background transparency applies to content area only (header remains solid)
 *
 * @feature 007-windows-system
 * @feature 010-state-persistence-system
 * @feature 013-window-opacity-control
 * @feature 018-window-background-toggle
 * @feature 026-sc-hud-theme
 * @feature 033-excalidraw-view-polish
 */

import { useRef, useCallback, useState } from "react";
import { motion } from "motion/react";
import type { WindowInstance } from '@/types/windows';
import { WINDOW_CONSTANTS } from '@/types/windows';
import { useWindows } from '@/contexts/WindowsContext';
import { usePersistenceContext } from '@/contexts/PersistenceContext';
import { WindowHeader } from './WindowHeader';

interface WindowProps {
  window: WindowInstance;
  isInteractive?: boolean;
  onExitComplete?: () => void;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const RESIZE_HANDLE_SIZE = 8;

export function Window({ window: windowInstance, isInteractive = true, onExitComplete }: WindowProps) {
  const { id, title, component: Component, componentProps, x, y, width, height, zIndex, opacity, backgroundTransparent } =
    windowInstance;

  const { focusWindow, resizeWindow, moveWindow, setWindowOpacity, setWindowBackgroundTransparent } = useWindows();
  const persistence = usePersistenceContext();
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

  // Handle window focus on click (only in interactive mode)
  const handleWindowClick = useCallback(() => {
    if (isInteractive) {
      focusWindow(id);
    }
  }, [id, focusWindow, isInteractive]);

  // Get cursor style based on position (only in interactive mode)
  const getCursorStyle = (direction: ResizeDirection): string => {
    if (!isInteractive) return '';
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

  // Handle resize pointer down (only in interactive mode)
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isInteractive) return;

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
  }, [x, y, width, height, isInteractive]);

  // Handle resize pointer move (only in interactive mode)
  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isInteractive) return;

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
  }, [id, moveWindow, resizeWindow, isInteractive]);

  // Handle resize pointer up
  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    // Trigger persistence save on resize end
    if (resizeRef.current) {
      persistence?.onWindowMoved();
    }
    resizeRef.current = null;
  }, [persistence]);

  // Handle pointer leave to reset cursor
  const handlePointerLeave = useCallback(() => {
    if (!resizeRef.current) {
      setResizeDirection(null);
    }
  }, []);

  // Mode-aware styles
  // Interactive: Full border, shadow (regardless of background transparency)
  // Passive: Subtle border, backdrop blur - but hide shadow/border when transparent
  // Opacity is same in both modes (user-controlled via slider)
  // Mode-aware styles with SC theming
  // Interactive: SC border with glow, corner accents
  // Passive: Subtle border, backdrop blur - but hide when transparent
  const modeClasses = isInteractive
    ? 'border border-border rounded-lg sc-glow-transition sc-corner-accents shadow-glow-sm hover:shadow-glow-md'
    : backgroundTransparent
      ? 'rounded-lg' // No border, shadow, or backdrop blur when transparent in passive mode
      : 'border border-border/50 rounded-lg shadow-glow-sm backdrop-blur-sm';

  // Content height based on header visibility
  const contentHeight = isInteractive
    ? `calc(100% - ${WINDOW_CONSTANTS.HEADER_HEIGHT}px)`
    : '100%';

  // Window background class based on backgroundTransparent setting
  // Transparency only applies in non-interactive (passive) mode
  // In interactive mode, background is always solid regardless of setting
  // Setting still persists so it applies when switching back to passive mode
  const isEffectivelyTransparent = !isInteractive && backgroundTransparent;
  const windowBackgroundClass = isEffectivelyTransparent ? '' : 'bg-background';

  // Content background class - only needed when solid to ensure content area is opaque
  const contentBackgroundClass = isEffectivelyTransparent ? '' : 'bg-background';

  // Pointer events class - needed because parent container is pointer-events-none
  const pointerEventsClass = isInteractive ? 'pointer-events-auto' : 'pointer-events-none';

  return (
    <motion.div
      className={`absolute ${windowBackgroundClass} overflow-hidden ${modeClasses} ${getCursorStyle(resizeDirection)} ${pointerEventsClass}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: opacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: isInteractive ? 0.15 : 0.1, ease: "easeOut" }}
      onPointerDown={handleWindowClick}
      onAnimationComplete={(definition) => {
        if (definition === 'exit' && onExitComplete) {
          onExitComplete();
        }
      }}
    >
      {/* Resize handles - invisible overlay for detecting edge/corner hover */}
      <div
        className={`absolute inset-0 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Header - only visible in interactive mode */}
        {isInteractive && (
          <div className="pointer-events-auto">
            <WindowHeader
              windowId={id}
              title={title}
              x={x}
              y={y}
              isInteractive={isInteractive}
              opacity={opacity}
              onOpacityChange={(newOpacity) => setWindowOpacity(id, newOpacity)}
              onOpacityCommit={() => persistence?.onWindowMoved()}
              backgroundTransparent={backgroundTransparent}
              onBackgroundTransparentChange={(transparent) => setWindowBackgroundTransparent(id, transparent)}
              onBackgroundTransparentCommit={() => persistence?.onWindowMoved()}
            />
          </div>
        )}

        {/* Content - background transparency applies here */}
        <div
          className={`overflow-auto pointer-events-auto ${contentBackgroundClass}`}
          style={{ height: contentHeight }}
        >
          <Component {...(componentProps ?? {})} windowId={id} isInteractive={isInteractive} backgroundTransparent={backgroundTransparent} opacity={opacity} windowX={x} windowY={y} windowWidth={width} windowHeight={height} />
        </div>
      </div>
    </motion.div>
  );
}
