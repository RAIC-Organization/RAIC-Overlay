interface HeaderPanelProps {
  visible: boolean;
}

export function HeaderPanel({ visible }: HeaderPanelProps) {
  if (!visible) return null;

  return (
    <div
      className="w-[400px] h-[60px] bg-background border-2 border-border rounded-md flex items-center justify-center box-border"
      role="status"
      aria-live="polite"
      aria-label="RAIC Overlay status panel"
    >
      <h1 className="text-foreground text-lg font-semibold m-0 font-sans">
        RAIC Overlay
      </h1>
    </div>
  );
}
