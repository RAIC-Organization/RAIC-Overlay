"use client";

/**
 * Window Component
 *
 * Renders a single window with header and content. Positioned absolutely
 * within the WindowsContainer. Phase 3/US1 provides basic positioning
 * and content rendering with open animation. Resize, drag, and mode
 * switching are added in later phases.
 *
 * @feature 007-windows-system
 */

import { motion } from "motion/react";
import type { WindowInstance } from '@/types/windows';
import { WindowHeader } from './WindowHeader';

interface WindowProps {
  window: WindowInstance;
}

export function Window({ window: windowInstance }: WindowProps) {
  const { title, component: Component, componentProps, x, y, width, height, zIndex } =
    windowInstance;

  return (
    <motion.div
      className="absolute bg-background border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Header */}
      <WindowHeader title={title} />

      {/* Content */}
      <div
        className="overflow-auto"
        style={{ height: `calc(100% - 32px)` }}
      >
        <Component {...(componentProps ?? {})} />
      </div>
    </motion.div>
  );
}
