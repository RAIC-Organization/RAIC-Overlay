import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppIcon } from "../../src/components/AppIcon";

// Track useReducedMotion return value
let mockReducedMotion = false;

// Mock motion/react to simplify testing animations
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      animate,
      transition,
      "data-testid": testId,
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      animate?: { opacity?: number };
      transition?: { duration?: number };
      "data-testid"?: string;
    }) => (
      <div
        className={className}
        style={style}
        data-testid={testId}
        data-animate-opacity={animate?.opacity}
        data-transition-duration={transition?.duration}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => mockReducedMotion,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    alt,
    width,
    height,
    "data-testid": testId,
  }: {
    alt: string;
    width: number;
    height: number;
    "data-testid"?: string;
  }) => (
    <img
      alt={alt}
      width={width}
      height={height}
      data-testid={testId || "app-icon-image"}
    />
  ),
}));

describe("AppIcon", () => {
  beforeEach(() => {
    mockReducedMotion = false;
  });

  it("renders when visible is true", () => {
    render(<AppIcon visible={true} />);
    expect(screen.getByTestId("app-icon-image")).toBeInTheDocument();
  });

  it("does not render when visible is false", () => {
    const { container } = render(<AppIcon visible={false} />);
    expect(container.querySelector('[data-testid="app-icon-image"]')).toBeNull();
  });

  it("displays at 50x50 pixels dimensions", () => {
    render(<AppIcon visible={true} />);
    const image = screen.getByTestId("app-icon-image");
    expect(image).toHaveAttribute("width", "50");
    expect(image).toHaveAttribute("height", "50");
  });

  it("has correct positioning (fixed, top-50px, left-50px)", () => {
    render(<AppIcon visible={true} />);
    const container = screen.getByTestId("app-icon-container");
    expect(container).toHaveClass("fixed");
    expect(container).toHaveClass("top-[50px]");
    expect(container).toHaveClass("left-[50px]");
  });
});

describe("AppIcon opacity transitions (US3)", () => {
  beforeEach(() => {
    mockReducedMotion = false;
  });

  it("has 100% opacity in windowed mode", () => {
    render(<AppIcon visible={true} mode="windowed" />);
    const container = screen.getByTestId("app-icon-container");
    expect(container).toHaveAttribute("data-animate-opacity", "1");
  });

  it("has 40% opacity in fullscreen mode", () => {
    render(<AppIcon visible={true} mode="fullscreen" />);
    const container = screen.getByTestId("app-icon-container");
    expect(container).toHaveAttribute("data-animate-opacity", "0.4");
  });

  it("respects reduced motion preferences", () => {
    mockReducedMotion = true;
    render(<AppIcon visible={true} />);
    const container = screen.getByTestId("app-icon-container");
    // When reduced motion is preferred, duration should be 0
    expect(container).toHaveAttribute("data-transition-duration", "0");
  });
});

describe("AppIcon click-through behavior (US4)", () => {
  it("has pointer-events-none in fullscreen mode", () => {
    render(<AppIcon visible={true} mode="fullscreen" />);
    const container = screen.getByTestId("app-icon-container");
    expect(container).toHaveClass("pointer-events-none");
  });

  it("has pointer-events-auto in windowed mode", () => {
    render(<AppIcon visible={true} mode="windowed" />);
    const container = screen.getByTestId("app-icon-container");
    // In windowed mode, pointer-events-none should NOT be present
    expect(container).not.toHaveClass("pointer-events-none");
  });
});
