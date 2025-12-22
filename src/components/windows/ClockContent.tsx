'use client';

/**
 * ClockContent Component
 *
 * Displays system time in 24-hour format (HH:MM:SS) with white text
 * and blue text-stroke for contrast. Auto-scales text based on container size.
 *
 * @feature 023-system-clock-window
 */

import { useState, useEffect } from 'react';

export interface ClockContentProps {
  isInteractive: boolean;
  windowId?: string;
}

export function ClockContent({ isInteractive }: ClockContentProps) {
  // T005: Time state with 1-second interval update
  const [time, setTime] = useState(new Date());

  // T005 & T007: Update time every second with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // T007: Cleanup interval on unmount
    return () => clearInterval(interval);
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
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      {/* T008-T010, T012: Styled text with white color, blue stroke, system font, and pointer-events for drag */}
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
          // Base font size (will be made dynamic in Phase 5)
          fontSize: '48px',
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
}
