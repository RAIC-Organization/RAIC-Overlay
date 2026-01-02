'use client';

/**
 * SessionTimerWidgetContent Component
 *
 * Displays elapsed session time (HH:MM:SS) with Orbitron font
 * and Apple-inspired liquid glass text effect with blue tint.
 * Auto-scales text based on container size using ResizeObserver.
 *
 * Timer starts when target process is detected and resets when
 * a new session begins (process restart).
 *
 * @feature 044-session-timer-widget
 */

import { useState, useEffect, useRef } from 'react';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { TIMER_WIDGET_DEFAULTS } from '@/types/widgets';

export interface SessionTimerWidgetContentProps {
  isInteractive: boolean;
  widgetId?: string;
}

export function SessionTimerWidgetContent({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInteractive,
}: SessionTimerWidgetContentProps) {
  // Get session timer state from shared hook
  const { formattedTime } = useSessionTimer();

  // containerRef for ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  // fontSize state for auto-scaling
  const [fontSize, setFontSize] = useState(48);

  // ResizeObserver to calculate fontSize from container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // Scale font to fit: ~15% of width or ~70% of height
      const newSize = Math.min(width * 0.15, height * 0.7);
      // Minimum font size constraint
      setFontSize(Math.max(TIMER_WIDGET_DEFAULTS.MIN_FONT_SIZE, newSize));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    // pointer-events: none on container for click-through on transparent areas
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center pointer-events-none"
    >
      {/* Styled text with Orbitron font, liquid glass effect, and dynamic fontSize */}
      <span
        className="pointer-events-auto cursor-move select-none font-orbitron liquid-glass-text"
        style={{
          fontSize: `${fontSize}px`,
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
}
