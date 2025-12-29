'use client';

/**
 * ClockWidgetContent Component
 *
 * Displays system time in 24-hour format (HH:mm:ss) with Orbitron font
 * and Apple-inspired liquid glass text effect with blue tint.
 * Auto-scales text based on container size using ResizeObserver.
 *
 * This is the widget version (no window chrome) replacing the window-based
 * ClockContent component.
 *
 * @feature 036-liquid-glass-clock
 */

import { useState, useEffect, useRef } from 'react';
import { CLOCK_WIDGET_DEFAULTS } from '@/types/widgets';

export interface ClockWidgetContentProps {
  isInteractive: boolean;
  widgetId?: string;
}

export function ClockWidgetContent({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInteractive,
}: ClockWidgetContentProps) {
  // Time state with 1-second interval update
  const [time, setTime] = useState(new Date());
  // containerRef for ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  // fontSize state for auto-scaling
  const [fontSize, setFontSize] = useState(48);

  // Update time every second with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, CLOCK_WIDGET_DEFAULTS.UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // ResizeObserver to calculate fontSize from container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // Scale font to fit: ~15% of width or ~70% of height
      const newSize = Math.min(width * 0.15, height * 0.7);
      // Minimum font size constraint
      setFontSize(Math.max(CLOCK_WIDGET_DEFAULTS.MIN_FONT_SIZE, newSize));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 24-hour time formatting using toLocaleTimeString
  const formattedTime = time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

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
