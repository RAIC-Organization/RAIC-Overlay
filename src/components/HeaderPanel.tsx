import { Card } from "@/components/ui/card";
import { OverlayMode } from "@/types/overlay";
import { WindowRect } from "@/types/ipc";

// T022: HeaderPanel with mode-based opacity and scale factor calculation
// fullscreen mode = click-through (60% transparent)
// windowed mode = interactive (0% transparent, fully visible)
interface HeaderPanelProps {
  visible?: boolean;
  mode?: OverlayMode;
  targetRect?: WindowRect | null;
}

// T022: Calculate scale factor based on target window size
// This ensures the header panel scales appropriately when attached to different window sizes
function calculateScaleFactor(targetRect: WindowRect | null): number {
  if (!targetRect) return 1;

  // Base dimensions for the header panel
  const baseWidth = 400;
  const baseHeight = 60;

  // Calculate scale based on target window width
  // Clamp between 0.5 and 2.0 to ensure readability
  const widthScale = Math.min(2.0, Math.max(0.5, targetRect.width / baseWidth));

  // For very small windows, also consider height
  const heightScale = Math.min(2.0, Math.max(0.5, targetRect.height / (baseHeight * 3)));

  // Use the smaller of the two scales to ensure it fits
  return Math.min(widthScale, heightScale);
}

export function HeaderPanel({
  visible = true,
  mode = "windowed",
  targetRect = null,
}: HeaderPanelProps) {
  // If visible prop is explicitly false, don't render
  if (!visible) return null;

  // Apply opacity class based on mode
  const opacityClass =
    mode === "fullscreen" ? "header-click-through" : "header-interactive";

  // T022: Calculate scale factor for target window attachment
  const scaleFactor = calculateScaleFactor(targetRect);

  // When attached to target, use a container to center the header at top
  if (targetRect) {
    return (
      <div className="w-full h-full flex justify-center items-start pt-0">
        <Card
          className={`w-[400px] h-[60px] flex items-center justify-center ${opacityClass}`}
          role="status"
          aria-live="polite"
          aria-label="RAIC Overlay status panel"
          style={{
            fontSize: `${scaleFactor}rem`,
          }}
        >
          <h1
            className="text-card-foreground font-semibold m-0 font-sans"
            style={{
              fontSize: `${1.125 * scaleFactor}rem`,
            }}
          >
            RAIC Overlay
          </h1>
        </Card>
      </div>
    );
  }

  // Default: no target, render as fixed size
  return (
    <Card
      className={`w-[400px] h-[60px] flex items-center justify-center ${opacityClass}`}
      role="status"
      aria-live="polite"
      aria-label="RAIC Overlay status panel"
    >
      <h1 className="text-card-foreground font-semibold m-0 font-sans text-lg">
        RAIC Overlay
      </h1>
    </Card>
  );
}
