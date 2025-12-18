"use client";

/**
 * Window Header Component
 *
 * Displays the window title with drag-to-move functionality and close button.
 * Drag functionality uses pointer events for unified mouse/touch support.
 * Only renders/functions in interactive mode.
 *
 * @feature 007-windows-system
 */

import { useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { WINDOW_CONSTANTS } from '@/types/windows';
import { useWindows } from '@/contexts/WindowsContext';

interface WindowHeaderProps {
  windowId: string;
  title: string;
  x: number;
  y: number;
  isInteractive?: boolean;
}

export function WindowHeader({ windowId, title, x, y, isInteractive = true }: WindowHeaderProps) {
  const { moveWindow, closeWindow } = useWindows();
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
    dragStartRef.current = null;
  }, []);

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
      <span className="text-sm font-medium truncate flex-1">{title}</span>
      <button
        onClick={handleClose}
        className="ml-2 p-1 rounded hover:bg-muted transition-colors cursor-pointer"
        aria-label="Close window"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
