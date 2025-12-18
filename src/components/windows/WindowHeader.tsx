"use client";

/**
 * Window Header Component
 *
 * Displays the window title. In Phase 3/US1, this is a basic header
 * with title display only. Drag and close functionality will be
 * added in Phase 4/US2.
 *
 * @feature 007-windows-system
 */

import { WINDOW_CONSTANTS } from '@/types/windows';

interface WindowHeaderProps {
  title: string;
}

export function WindowHeader({ title }: WindowHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 bg-muted/50 border-b border-border select-none"
      style={{ height: WINDOW_CONSTANTS.HEADER_HEIGHT }}
    >
      <span className="text-sm font-medium truncate">{title}</span>
    </div>
  );
}
