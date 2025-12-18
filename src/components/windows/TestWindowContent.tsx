"use client";

/**
 * Test Window Content
 *
 * A simple test component for validating the windows system.
 * Displays basic information and demonstrates that windows can
 * render arbitrary React components.
 *
 * @feature 007-windows-system
 */

interface TestWindowContentProps {
  message?: string;
}

export function TestWindowContent({ message }: TestWindowContentProps) {
  return (
    <div className="p-4 text-sm">
      <h3 className="font-medium mb-2">Test Window</h3>
      <p className="text-muted-foreground">
        {message ?? "This is a test window to validate the windows system."}
      </p>
      <div className="mt-4 p-2 bg-muted rounded text-xs">
        <p>Window features:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Drag by header to move</li>
          <li>Drag edges/corners to resize</li>
          <li>Click to bring to front</li>
          <li>Close button in header</li>
        </ul>
      </div>
    </div>
  );
}
