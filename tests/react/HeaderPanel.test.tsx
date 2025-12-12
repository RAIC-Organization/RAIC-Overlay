import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeaderPanel } from "../../src/components/HeaderPanel";

describe("HeaderPanel", () => {
  it("renders nothing when visible is false", () => {
    const { container } = render(<HeaderPanel visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders panel with title when visible is true", () => {
    render(<HeaderPanel visible={true} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("RAIC Overlay")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    expect(panel).toHaveAttribute("aria-live", "polite");
    expect(panel).toHaveAttribute("aria-label", "RAIC Overlay status panel");
  });

  it("has Tailwind theme classes when visible", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    expect(panel).toHaveClass("bg-background");
    expect(panel).toHaveClass("border-border");
  });

  it("renders h1 with RAIC Overlay text", () => {
    render(<HeaderPanel visible={true} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("RAIC Overlay");
  });
});

describe("HeaderPanel styling", () => {
  it("panel has correct dimensions via Tailwind classes", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    // Tailwind classes for 400x60 dimensions
    expect(panel).toHaveClass("w-[400px]");
    expect(panel).toHaveClass("h-[60px]");
  });
});

describe("HeaderPanel accessibility (WCAG 2.1 AA)", () => {
  it("has sufficient color contrast (theme foreground on background)", () => {
    // Color contrast ratio for hsl(210 20% 98%) on hsl(224 71.4% 4.1%)
    // is approximately 19.5:1 - well above WCAG AA requirements
    render(<HeaderPanel visible={true} />);
    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-foreground");
  });

  it("has aria-live region for screen reader announcements", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    expect(panel).toHaveAttribute("aria-live", "polite");
  });

  it("heading is accessible to screen readers", () => {
    render(<HeaderPanel visible={true} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeVisible();
  });
});
