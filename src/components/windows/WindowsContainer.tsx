"use client";

/**
 * Windows Container Component
 *
 * Container that renders all windows and subscribes to window events.
 * Acts as the orchestrator for the windowing system within the overlay.
 * Uses AnimatePresence for open/close animations.
 * Supports mode-aware rendering (interactive vs passive mode).
 *
 * @feature 007-windows-system
 */

import { AnimatePresence } from "motion/react";
import { useWindows } from '@/contexts/WindowsContext';
import { useWindowEvents } from '@/hooks/useWindowEvents';
import { Window } from './Window';
import type { OverlayMode } from '@/types/overlay';

interface WindowsContainerProps {
  mode?: OverlayMode;
}

export function WindowsContainer({ mode = 'windowed' }: WindowsContainerProps) {
  // Subscribe to window events
  useWindowEvents();

  // Get windows from context
  const { windows } = useWindows();

  // Determine if we're in interactive mode
  const isInteractive = mode === 'windowed';

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {windows.map((windowInstance) => (
          // Key directly on Window - AnimatePresence tracks keys on direct children
          // Window's motion.div handles its own positioning and pointer-events
          <Window key={windowInstance.id} window={windowInstance} isInteractive={isInteractive} />
        ))}
      </AnimatePresence>
    </div>
  );
}
