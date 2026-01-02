"use client";

/**
 * DownloadProgress Component
 *
 * Shows download progress with a progress bar, percentage, and bytes downloaded.
 * Uses SC HUD theme styling.
 *
 * @feature 049-auto-update
 */

interface DownloadProgressProps {
  bytesDownloaded: number;
  totalBytes: number;
}

export function DownloadProgress({
  bytesDownloaded,
  totalBytes,
}: DownloadProgressProps) {
  // Calculate percentage
  const percentage =
    totalBytes > 0 ? Math.round((bytesDownloaded / totalBytes) * 100) : 0;

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
        {/* Glow effect on progress */}
        <div
          className="absolute inset-y-0 left-0 bg-primary/50 blur-sm rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">
          {formatBytes(bytesDownloaded)} / {formatBytes(totalBytes)}
        </span>
        <span className="font-mono text-primary">{percentage}%</span>
      </div>
    </div>
  );
}
