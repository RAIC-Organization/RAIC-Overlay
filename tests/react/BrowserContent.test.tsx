import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  BrowserContent,
  BROWSER_DEFAULTS,
} from "../../src/components/windows/BrowserContent";

// Mock the BrowserToolbar component for isolated testing
vi.mock("../../src/components/windows/BrowserToolbar", () => ({
  BrowserToolbar: ({
    url,
    canGoBack,
    canGoForward,
    zoom,
    isLoading,
    onNavigate,
    onBack,
    onForward,
    onRefresh,
    onZoomIn,
    onZoomOut,
  }: {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    zoom: number;
    isLoading: boolean;
    onNavigate: (url: string) => void;
    onBack: () => void;
    onForward: () => void;
    onRefresh: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
  }) => (
    <div data-testid="browser-toolbar">
      <span data-testid="toolbar-url">{url}</span>
      <span data-testid="toolbar-zoom">{zoom}%</span>
      <span data-testid="toolbar-loading">{isLoading ? "loading" : "idle"}</span>
      <button
        data-testid="back-btn"
        onClick={onBack}
        disabled={!canGoBack}
      >
        Back
      </button>
      <button
        data-testid="forward-btn"
        onClick={onForward}
        disabled={!canGoForward}
      >
        Forward
      </button>
      <button data-testid="refresh-btn" onClick={onRefresh}>
        Refresh
      </button>
      <button data-testid="zoom-in-btn" onClick={onZoomIn}>
        Zoom In
      </button>
      <button data-testid="zoom-out-btn" onClick={onZoomOut}>
        Zoom Out
      </button>
      <input
        data-testid="url-input"
        defaultValue={url}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onNavigate((e.target as HTMLInputElement).value);
          }
        }}
      />
    </div>
  ),
}));

describe("BrowserContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<BrowserContent isInteractive={true} />);
    expect(screen.getByTestId("browser-toolbar")).toBeInTheDocument();
  });

  it("renders iframe with default URL", () => {
    render(<BrowserContent isInteractive={true} />);
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", BROWSER_DEFAULTS.DEFAULT_URL);
  });

  it("has default zoom of 50%", () => {
    render(<BrowserContent isInteractive={true} />);
    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("50%");
  });
});

describe("BrowserContent toolbar visibility", () => {
  it("shows toolbar when isInteractive is true", () => {
    render(<BrowserContent isInteractive={true} />);
    expect(screen.getByTestId("browser-toolbar")).toBeInTheDocument();
  });

  it("hides toolbar when isInteractive is false", () => {
    render(<BrowserContent isInteractive={false} />);
    expect(screen.queryByTestId("browser-toolbar")).not.toBeInTheDocument();
  });

  it("updates toolbar visibility when isInteractive changes", () => {
    const { rerender } = render(<BrowserContent isInteractive={true} />);
    expect(screen.getByTestId("browser-toolbar")).toBeInTheDocument();

    rerender(<BrowserContent isInteractive={false} />);
    expect(screen.queryByTestId("browser-toolbar")).not.toBeInTheDocument();

    rerender(<BrowserContent isInteractive={true} />);
    expect(screen.getByTestId("browser-toolbar")).toBeInTheDocument();
  });
});

describe("BrowserContent zoom functionality", () => {
  it("increases zoom when zoom in is clicked", () => {
    render(<BrowserContent isInteractive={true} />);
    const zoomInBtn = screen.getByTestId("zoom-in-btn");

    fireEvent.click(zoomInBtn);
    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("60%");

    fireEvent.click(zoomInBtn);
    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("70%");
  });

  it("decreases zoom when zoom out is clicked", () => {
    render(<BrowserContent isInteractive={true} />);
    const zoomOutBtn = screen.getByTestId("zoom-out-btn");

    fireEvent.click(zoomOutBtn);
    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("40%");

    fireEvent.click(zoomOutBtn);
    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("30%");
  });

  it("does not exceed maximum zoom of 200%", () => {
    render(<BrowserContent isInteractive={true} />);
    const zoomInBtn = screen.getByTestId("zoom-in-btn");

    // Click 20 times to try to exceed 200%
    for (let i = 0; i < 20; i++) {
      fireEvent.click(zoomInBtn);
    }

    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("200%");
  });

  it("does not go below minimum zoom of 10%", () => {
    render(<BrowserContent isInteractive={true} />);
    const zoomOutBtn = screen.getByTestId("zoom-out-btn");

    // Click 10 times to try to go below 10%
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomOutBtn);
    }

    expect(screen.getByTestId("toolbar-zoom")).toHaveTextContent("10%");
  });
});

describe("BrowserContent navigation", () => {
  it("navigates to new URL when enter is pressed", () => {
    render(<BrowserContent isInteractive={true} />);
    const urlInput = screen.getByTestId("url-input");

    fireEvent.change(urlInput, { target: { value: "example.com" } });
    fireEvent.keyDown(urlInput, { key: "Enter" });

    // URL should be normalized with https://
    expect(screen.getByTestId("toolbar-url")).toHaveTextContent(
      "https://example.com"
    );
  });

  it("back button is disabled initially", () => {
    render(<BrowserContent isInteractive={true} />);
    const backBtn = screen.getByTestId("back-btn");
    expect(backBtn).toBeDisabled();
  });

  it("forward button is disabled initially", () => {
    render(<BrowserContent isInteractive={true} />);
    const forwardBtn = screen.getByTestId("forward-btn");
    expect(forwardBtn).toBeDisabled();
  });

  it("enables back button after navigating", () => {
    render(<BrowserContent isInteractive={true} />);
    const urlInput = screen.getByTestId("url-input");

    fireEvent.change(urlInput, { target: { value: "example.com" } });
    fireEvent.keyDown(urlInput, { key: "Enter" });

    const backBtn = screen.getByTestId("back-btn");
    expect(backBtn).not.toBeDisabled();
  });
});

describe("BrowserContent non-interactive mode", () => {
  it("renders blocking overlay when not interactive", () => {
    const { container } = render(<BrowserContent isInteractive={false} />);
    // Look for the overlay div that blocks iframe interaction
    const overlay = container.querySelector(".absolute.inset-0.z-10");
    expect(overlay).toBeInTheDocument();
  });

  it("does not render blocking overlay when interactive", () => {
    const { container } = render(<BrowserContent isInteractive={true} />);
    const overlay = container.querySelector(".absolute.inset-0.z-10");
    expect(overlay).not.toBeInTheDocument();
  });
});

describe("BrowserContent ephemeral state", () => {
  it("each instance has independent state", () => {
    render(<BrowserContent isInteractive={true} />);
    render(<BrowserContent isInteractive={true} />);

    // Both should have their own toolbar instances
    const toolbars = screen.getAllByTestId("browser-toolbar");
    expect(toolbars).toHaveLength(2);
  });
});

describe("BrowserContent constants", () => {
  it("exports BROWSER_DEFAULTS with correct values", () => {
    expect(BROWSER_DEFAULTS.DEFAULT_URL).toBe("https://www.google.com");
    expect(BROWSER_DEFAULTS.DEFAULT_ZOOM).toBe(50);
    expect(BROWSER_DEFAULTS.ZOOM_MIN).toBe(10);
    expect(BROWSER_DEFAULTS.ZOOM_MAX).toBe(200);
    expect(BROWSER_DEFAULTS.ZOOM_STEP).toBe(10);
  });
});
