import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DrawContent } from "../../src/components/windows/DrawContent";

// Mock next/dynamic to immediately render the component
vi.mock("next/dynamic", () => ({
  default: (importFn: () => Promise<{ default: React.ComponentType }>) => {
    // Return a component that renders the imported component
    const Component = (props: Record<string, unknown>) => {
      const MockExcalidraw = ({
        viewModeEnabled,
        theme,
        initialData,
      }: {
        viewModeEnabled?: boolean;
        theme?: string;
        UIOptions?: Record<string, unknown>;
        initialData?: { appState?: { viewBackgroundColor?: string } };
      }) => {
        // Simulate Excalidraw's class behavior: adds excalidraw--view-mode when viewModeEnabled
        const className = `excalidraw${viewModeEnabled ? ' excalidraw--view-mode' : ''}`;
        const bgColor = initialData?.appState?.viewBackgroundColor ?? '#1e1e1e';
        return (
          <div
            data-testid="excalidraw-mock"
            data-viewmode={viewModeEnabled}
            data-theme={theme}
            data-bgcolor={bgColor}
            className={className}
          >
            {!viewModeEnabled && <div data-testid="excalidraw-toolbar">Toolbar</div>}
            <div data-testid="excalidraw-canvas">Canvas</div>
          </div>
        );
      };
      return <MockExcalidraw {...props} />;
    };
    return Component;
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

describe("DrawContent ephemeral state", () => {
  it("each instance has independent state", () => {
    // Render two instances
    const { container: container1 } = render(<DrawContent isInteractive={true} />);
    const { container: container2 } = render(<DrawContent isInteractive={true} />);

    // Both should have their own Excalidraw instances
    const excalidraws = screen.getAllByTestId("excalidraw-mock");
    expect(excalidraws).toHaveLength(2);

    // Each container should have its own wrapper
    expect(container1.firstChild).not.toBe(container2.firstChild);
  });
});

// Feature: 033-excalidraw-view-polish
describe("DrawContent view mode (033-excalidraw-view-polish)", () => {
  it("should have excalidraw--view-mode class when isInteractive is false", () => {
    render(<DrawContent isInteractive={false} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveClass("excalidraw--view-mode");
  });

  it("should not have excalidraw--view-mode class when isInteractive is true", () => {
    render(<DrawContent isInteractive={true} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).not.toHaveClass("excalidraw--view-mode");
  });
});

// Feature: 033-excalidraw-view-polish - Transparent background
describe("DrawContent background transparency (033-excalidraw-view-polish)", () => {
  it("should use transparent background when backgroundTransparent=true and isInteractive=false", () => {
    render(<DrawContent isInteractive={false} backgroundTransparent={true} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-bgcolor", "transparent");
  });

  it("should use default background when isInteractive=true regardless of backgroundTransparent", () => {
    render(<DrawContent isInteractive={true} backgroundTransparent={true} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    // Interactive mode ignores backgroundTransparent, uses default
    expect(excalidraw).toHaveAttribute("data-bgcolor", "#1e1e1e");
  });

  it("should use default background when backgroundTransparent=false", () => {
    render(<DrawContent isInteractive={false} backgroundTransparent={false} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-bgcolor", "#1e1e1e");
  });

  it("should use default background when backgroundTransparent is undefined", () => {
    render(<DrawContent isInteractive={false} />);
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-bgcolor", "#1e1e1e");
  });

  it("should preserve custom viewBackgroundColor from initialAppState when not transparent", () => {
    render(
      <DrawContent
        isInteractive={true}
        initialAppState={{ viewBackgroundColor: "#ff0000" }}
      />
    );
    const excalidraw = screen.getByTestId("excalidraw-mock");
    expect(excalidraw).toHaveAttribute("data-bgcolor", "#ff0000");
  });
});
