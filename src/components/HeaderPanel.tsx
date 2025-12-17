import { Card } from "@/components/ui/card";

// T030: Updated HeaderPanel to support both visible prop and always-visible modes
// When visible prop is provided, it controls rendering (windowed mode)
// When no prop is provided (fullscreen mode), the panel is always rendered
interface HeaderPanelProps {
  visible?: boolean;
}

export function HeaderPanel({ visible = true }: HeaderPanelProps) {
  // If visible prop is explicitly false, don't render
  if (!visible) return null;

  return (
    <Card
      className="w-[400px] h-[60px] flex items-center justify-center"
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
