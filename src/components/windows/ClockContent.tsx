'use client';

/**
 * ClockContent Component
 *
 * Displays system time in 24-hour format (HH:MM:SS) with white text
 * and blue text-stroke for contrast. Auto-scales text based on container size.
 *
 * @feature 023-system-clock-window
 */

import { useState, useEffect, useRef } from 'react';

export interface ClockContentProps {
  isInteractive: boolean;
  windowId?: string;
}

export function ClockContent({ isInteractive }: ClockContentProps) {
  // T005: Time state with 1-second interval update
  const [time, setTime] = useState(new Date());
  // T017: containerRef for ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  // T018: fontSize state for auto-scaling
  const [fontSize, setFontSize] = useState(48);

  // T005 & T007: Update time every second with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // T007: Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // T019: ResizeObserver to calculate fontSize from container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // Scale font to fit: ~15% of width or ~70% of height
      const newSize = Math.min(width * 0.15, height * 0.7);
      // T021: Minimum font size constraint (12px)
      setFontSize(Math.max(12, newSize));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // T006: 24-hour time formatting using toLocaleTimeString
  const formattedTime = time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    // T011: pointer-events: none on container for click-through on transparent areas
    // T017: ref attached for ResizeObserver
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center pointer-events-none"
    >
      {/* T008-T010, T012, T020: Styled text with white color, blue stroke, system font, pointer-events, and dynamic fontSize */}
      <span
        className="pointer-events-auto cursor-move select-none"
        style={{
          // T010: System font stack
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          // T008: White text color
          color: 'white',
          // T009: Blue border with -webkit-text-stroke and paint-order
          WebkitTextStroke: '2px #3b82f6',
          paintOrder: 'stroke fill',
          // T020: Dynamic font size from ResizeObserver
          fontSize: `${fontSize}px`,
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
}
