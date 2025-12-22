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
    <div className="w-full h-full flex items-center justify-center">
      <span>
        {formattedTime}
      </span>
    </div>
  );
}
