import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserToolbar } from "../../src/components/windows/BrowserToolbar";

describe("BrowserToolbar", () => {
  const defaultProps = {
    url: "https://example.com",
    canGoBack: false,
    canGoForward: false,
    zoom: 50,
    isLoading: false,
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    onForward: vi.fn(),
    onRefresh: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<BrowserToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText("Enter URL...")).toBeInTheDocument();
  });

  it("displays current URL in address bar", () => {
    render(<BrowserToolbar {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter URL...") as HTMLInputElement;
    expect(input.value).toBe("https://example.com");
  });

  it("displays zoom percentage", () => {
    render(<BrowserToolbar {...defaultProps} zoom={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});

describe("BrowserToolbar navigation buttons", () => {
  const defaultProps = {
    url: "https://example.com",
    canGoBack: false,
    canGoForward: false,
    zoom: 50,
    isLoading: false,
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    onForward: vi.fn(),
    onRefresh: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables back button when canGoBack is false", () => {
    render(<BrowserToolbar {...defaultProps} canGoBack={false} />);
    const backBtn = screen.getByTitle("Go back");
    expect(backBtn).toBeDisabled();
  });

  it("enables back button when canGoBack is true", () => {
    render(<BrowserToolbar {...defaultProps} canGoBack={true} />);
    const backBtn = screen.getByTitle("Go back");
    expect(backBtn).not.toBeDisabled();
  });

  it("disables forward button when canGoForward is false", () => {
    render(<BrowserToolbar {...defaultProps} canGoForward={false} />);
    const forwardBtn = screen.getByTitle("Go forward");
    expect(forwardBtn).toBeDisabled();
  });

  it("enables forward button when canGoForward is true", () => {
    render(<BrowserToolbar {...defaultProps} canGoForward={true} />);
    const forwardBtn = screen.getByTitle("Go forward");
    expect(forwardBtn).not.toBeDisabled();
  });

  it("calls onBack when back button is clicked", () => {
    render(<BrowserToolbar {...defaultProps} canGoBack={true} />);
    const backBtn = screen.getByTitle("Go back");
    fireEvent.click(backBtn);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onForward when forward button is clicked", () => {
    render(<BrowserToolbar {...defaultProps} canGoForward={true} />);
    const forwardBtn = screen.getByTitle("Go forward");
    fireEvent.click(forwardBtn);
    expect(defaultProps.onForward).toHaveBeenCalledTimes(1);
  });

  it("calls onRefresh when refresh button is clicked", () => {
    render(<BrowserToolbar {...defaultProps} />);
    const refreshBtn = screen.getByTitle("Refresh");
    fireEvent.click(refreshBtn);
    expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("BrowserToolbar address bar", () => {
  const defaultProps = {
    url: "https://example.com",
    canGoBack: false,
    canGoForward: false,
    zoom: 50,
    isLoading: false,
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    onForward: vi.fn(),
    onRefresh: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onNavigate when Enter is pressed", () => {
    const onNavigate = vi.fn();
    render(<BrowserToolbar {...defaultProps} onNavigate={onNavigate} />);
    const input = screen.getByPlaceholderText("Enter URL...") as HTMLInputElement;

    // Focus the input first to prevent the sync reset
    fireEvent.focus(input);
    // Change value
    fireEvent.change(input, { target: { value: "https://example.com" } });
    // Press Enter while still focused
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onNavigate).toHaveBeenCalledWith("https://example.com");
  });

  it("does not call onNavigate for other keys", () => {
    render(<BrowserToolbar {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter URL...");

    fireEvent.keyDown(input, { key: "Tab" });

    expect(defaultProps.onNavigate).not.toHaveBeenCalled();
  });
});

describe("BrowserToolbar zoom controls", () => {
  const defaultProps = {
    url: "https://example.com",
    canGoBack: false,
    canGoForward: false,
    zoom: 50,
    isLoading: false,
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    onForward: vi.fn(),
    onRefresh: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onZoomIn when zoom in button is clicked", () => {
    render(<BrowserToolbar {...defaultProps} />);
    const zoomInBtn = screen.getByTitle("Zoom in");
    fireEvent.click(zoomInBtn);
    expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls onZoomOut when zoom out button is clicked", () => {
    render(<BrowserToolbar {...defaultProps} />);
    const zoomOutBtn = screen.getByTitle("Zoom out");
    fireEvent.click(zoomOutBtn);
    expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("disables zoom out button when zoom is at minimum (10)", () => {
    render(<BrowserToolbar {...defaultProps} zoom={10} />);
    const zoomOutBtn = screen.getByTitle("Zoom out");
    expect(zoomOutBtn).toBeDisabled();
  });

  it("disables zoom in button when zoom is at maximum (200)", () => {
    render(<BrowserToolbar {...defaultProps} zoom={200} />);
    const zoomInBtn = screen.getByTitle("Zoom in");
    expect(zoomInBtn).toBeDisabled();
  });

  it("enables both zoom buttons at intermediate zoom values", () => {
    render(<BrowserToolbar {...defaultProps} zoom={100} />);
    const zoomInBtn = screen.getByTitle("Zoom in");
    const zoomOutBtn = screen.getByTitle("Zoom out");
    expect(zoomInBtn).not.toBeDisabled();
    expect(zoomOutBtn).not.toBeDisabled();
  });
});

describe("BrowserToolbar loading state", () => {
  const defaultProps = {
    url: "https://example.com",
    canGoBack: false,
    canGoForward: false,
    zoom: 50,
    isLoading: false,
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    onForward: vi.fn(),
    onRefresh: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
  };

  it("shows loading spinner when isLoading is true", () => {
    const { container } = render(
      <BrowserToolbar {...defaultProps} isLoading={true} />
    );
    // Look for the Loader2 icon with animate-spin class
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("hides loading spinner when isLoading is false", () => {
    const { container } = render(
      <BrowserToolbar {...defaultProps} isLoading={false} />
    );
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeInTheDocument();
  });
});

describe("BrowserToolbar layout", () => {
  const defaultProps = {
    url: "https://example.com",
    canGoBack: false,
    canGoForward: false,
    zoom: 50,
    isLoading: false,
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    onForward: vi.fn(),
    onRefresh: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
  };

  it("renders buttons in correct order: Back, Forward, Refresh, Address, Zoom-, %, Zoom+", () => {
    const { container } = render(<BrowserToolbar {...defaultProps} />);
    const buttons = container.querySelectorAll("button");

    // Should have 5 buttons: back, forward, refresh, zoom out, zoom in
    expect(buttons.length).toBe(5);

    // Check order by title attributes
    expect(buttons[0]).toHaveAttribute("title", "Go back");
    expect(buttons[1]).toHaveAttribute("title", "Go forward");
    expect(buttons[2]).toHaveAttribute("title", "Refresh");
    expect(buttons[3]).toHaveAttribute("title", "Zoom out");
    expect(buttons[4]).toHaveAttribute("title", "Zoom in");
  });
});
