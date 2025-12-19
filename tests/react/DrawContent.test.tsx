import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DrawContent } from "../../src/components/windows/DrawContent";

// Mock Excalidraw since it requires browser APIs
vi.mock("@excalidraw/excalidraw", () => ({
  Excalidraw: ({
    viewModeEnabled,
    theme,
  }: {
    viewModeEnabled?: boolean;
    theme?: string;
    UIOptions?: Record<string, unknown>;
  }) => (
    <div data-testid="excalidraw-mock" data-viewmode={viewModeEnabled} data-theme={theme}>
      {!viewModeEnabled && <div data-testid="excalidraw-toolbar">Toolbar</div>}
      <div data-testid="excalidraw-canvas">Canvas</div>
    </div>
  ),
  THEME: {
    DARK: "dark",
    LIGHT: "light",
  },
}));

describe("DrawContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<DrawContent isInteractive={true} />);
    expect(screen.getByTestId("excalidraw-mock")).toBeInTheDocument();
  });

  it("renders Excalidraw canvas", () => {
    render(<DrawContent isInteractive={true} />);
    expect(screen.getByTestId("excalidraw-canvas")).toBeInTheDocument();
  });

  it("shows toolbar when isInteractive is true", () => {
    render(<DrawContent isInteractive={true} />);
    expect(screen.getByTestId("excalidraw-toolbar")).toBeInTheDocument();
  });

  it("hides toolbar when isInteractive is false", () => {
    render(<DrawContent isInteractive={false} />);
    expect(screen.queryByTestId("excalidraw-toolbar")).not.toBeInTheDocument();
  });

  it("applies dark theme", () => {
    render(<DrawContent isInteractive={true} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-theme", "dark");
  });

  it("sets viewModeEnabled based on isInteractive prop", () => {
    const { rerender } = render(<DrawContent isInteractive={true} />);
    let excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-viewmode", "false");

    rerender(<DrawContent isInteractive={false} />);
    excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-viewmode", "true");
  });

  it("mounts with empty canvas (no initialData)", () => {
    render(<DrawContent isInteractive={true} />);
    // Component should render without any initial data
    expect(screen.getByTestId("excalidraw-canvas")).toBeInTheDocument();
  });
});

describe("DrawContent mode-awareness", () => {
  it("updates toolbar visibility when isInteractive changes", () => {
    const { rerender } = render(<DrawContent isInteractive={true} />);
    expect(screen.getByTestId("excalidraw-toolbar")).toBeInTheDocument();

    rerender(<DrawContent isInteractive={false} />);
    expect(screen.queryByTestId("excalidraw-toolbar")).not.toBeInTheDocument();

    rerender(<DrawContent isInteractive={true} />);
    expect(screen.getByTestId("excalidraw-toolbar")).toBeInTheDocument();
  });
});

describe("DrawContent container", () => {
  it("has full width and height container", () => {
    const { container } = render(<DrawContent isInteractive={true} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("h-full", "w-full");
  });
});
