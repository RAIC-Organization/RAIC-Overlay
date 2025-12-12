import { Card } from "@/components/ui/card";

interface HeaderPanelProps {
  visible: boolean;
}

export function HeaderPanel({ visible }: HeaderPanelProps) {
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
