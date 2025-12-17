import { Card } from "@/components/ui/card";
import { OverlayMode } from "@/types/overlay";

// HeaderPanel with mode-based opacity
// fullscreen mode = click-through (60% transparent)
// windowed mode = interactive (0% transparent, fully visible)
interface HeaderPanelProps {
  visible?: boolean;
  mode?: OverlayMode;
}

export function HeaderPanel({ visible = true, mode = 'windowed' }: HeaderPanelProps) {
  // If visible prop is explicitly false, don't render
  if (!visible) return null;

  // Apply opacity class based on mode
  const opacityClass = mode === 'fullscreen' ? 'header-click-through' : 'header-interactive';

  return (
    <Card
      className={`w-[400px] h-[60px] flex items-center justify-center ${opacityClass}`}
      role="status"
      aria-live="polite"
      aria-label="RAIC Overlay status panel"
    >
      <h1 className="text-card-foreground text-lg font-semibold m-0 font-sans">
        RAIC Overlay
      </h1>
    </Card>
  );
}
