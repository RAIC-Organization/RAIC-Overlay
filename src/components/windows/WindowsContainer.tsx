"use client";

/**
 * Windows Container Component
 *
 * Container that renders all windows and subscribes to window events.
 * Acts as the orchestrator for the windowing system within the overlay.
 * Uses AnimatePresence for open/close animations.
 *
 * @feature 007-windows-system
 */

import { AnimatePresence } from "motion/react";
import { useWindows } from '@/contexts/WindowsContext';
import { useWindowEvents } from '@/hooks/useWindowEvents';
import { Window } from './Window';

export function WindowsContainer() {
  // Subscribe to window events
  useWindowEvents();

  // Get windows from context
  const { windows } = useWindows();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {windows.map((windowInstance) => (
          <div key={windowInstance.id} className="pointer-events-auto">
            <Window window={windowInstance} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
