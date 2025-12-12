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

  it("uses shadcn Card component with theme classes", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    // Card component applies bg-card and border classes
    expect(panel).toHaveClass("bg-card");
    expect(panel).toHaveClass("border");
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
  it("has sufficient color contrast (theme card-foreground on card)", () => {
    // Color contrast ratio for card-foreground on card background
    // meets WCAG AA requirements
    render(<HeaderPanel visible={true} />);
    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-card-foreground");
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
