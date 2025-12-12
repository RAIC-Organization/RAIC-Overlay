interface HeaderPanelProps {
  visible: boolean;
}

export function HeaderPanel({ visible }: HeaderPanelProps) {
  if (!visible) return null;

  return (
    <div
      className="header-panel"
      role="status"
      aria-live="polite"
      aria-label="RAIC Overlay status panel"
    >
      <h1>RAIC Overlay</h1>
    </div>
  );
}
