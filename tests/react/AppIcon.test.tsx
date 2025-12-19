import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppIcon } from "../../src/components/AppIcon";

// Mock motion/react to simplify testing animations
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, style, "data-testid": testId }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      "data-testid"?: string;
    }) => (
      <div className={className} style={style} data-testid={testId}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, width, height, "data-testid": testId }: {
    alt: string;
    width: number;
    height: number;
    "data-testid"?: string;
  }) => (
    <img alt={alt} width={width} height={height} data-testid={testId || "app-icon-image"} />
  ),
}));

describe("AppIcon", () => {
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
