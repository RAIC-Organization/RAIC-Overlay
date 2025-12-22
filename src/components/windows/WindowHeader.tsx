"use client";

/**
 * Window Header Component
 *
 * Displays the window title with drag-to-move functionality and close button.
 * Drag functionality uses pointer events for unified mouse/touch support.
 * Only renders/functions in interactive mode.
 * Triggers persistence on drag completion.
 *
 * @feature 007-windows-system
 * @feature 010-state-persistence-system
 * @feature 018-window-background-toggle
 */

import { useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { WINDOW_CONSTANTS } from '@/types/windows';
import { useWindows } from '@/contexts/WindowsContext';
import { usePersistenceContext } from '@/contexts/PersistenceContext';
import { OpacitySlider } from './OpacitySlider';
import { BackgroundToggle } from './BackgroundToggle';

interface WindowHeaderProps {
  windowId: string;
  title: string;
  x: number;
  y: number;
  isInteractive?: boolean;
  /** Current window opacity for slider */
  opacity: number;
  /** Callback when opacity changes */
  onOpacityChange: (opacity: number) => void;
  /** Callback when opacity adjustment completes */
  onOpacityCommit: () => void;
  /** Current background transparency state */
  backgroundTransparent: boolean;
  /** Callback when background transparency changes */
  onBackgroundTransparentChange: (transparent: boolean) => void;
  /** Callback when background transparency change completes */
  onBackgroundTransparentCommit: () => void;
}

export function WindowHeader({
  windowId,
  title,
  x,
  y,
  isInteractive = true,
  opacity,
  onOpacityChange,
  onOpacityCommit,
  backgroundTransparent,
  onBackgroundTransparentChange,
  onBackgroundTransparentCommit,
}: WindowHeaderProps) {
  const { moveWindow, closeWindow } = useWindows();
  const persistence = usePersistenceContext();
  const dragStartRef = useRef<{ startX: number; startY: number; windowX: number; windowY: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isInteractive) return;

    // Prevent dragging when clicking the close button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      windowX: x,
      windowY: y,
    };
  }, [x, y, isInteractive]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isInteractive || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = dragStartRef.current.windowX + deltaX;
    const newY = dragStartRef.current.windowY + deltaY;

    requestAnimationFrame(() => {
      moveWindow(windowId, newX, newY);
    });
  }, [windowId, moveWindow, isInteractive]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    // Trigger persistence save on drag end
    if (dragStartRef.current) {
      persistence?.onWindowMoved();
    }
    dragStartRef.current = null;
  }, [persistence]);

  const handleClose = useCallback(() => {
    if (!isInteractive) return;
    closeWindow(windowId);
  }, [windowId, closeWindow, isInteractive]);

  // Don't render in passive mode (header is hidden)
  if (!isInteractive) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between px-3 bg-muted/50 border-b border-border select-none cursor-move"
      style={{ height: WINDOW_CONSTANTS.HEADER_HEIGHT }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <span className="font-display text-sm font-medium truncate flex-1">{title}</span>
      <div
        className="flex items-center gap-2 cursor-default"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <OpacitySlider
          value={opacity}
          onChange={onOpacityChange}
          onCommit={onOpacityCommit}
        />
        <BackgroundToggle
          value={backgroundTransparent}
          onChange={onBackgroundTransparentChange}
          onCommit={onBackgroundTransparentCommit}
        />
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
          aria-label="Close window"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
