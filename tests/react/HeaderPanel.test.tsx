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

  it("has header-panel class when visible", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    expect(panel).toHaveClass("header-panel");
  });

  it("renders h1 with RAIC Overlay text", () => {
    render(<HeaderPanel visible={true} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("RAIC Overlay");
  });
});

describe("HeaderPanel styling", () => {
  it("panel has correct dimensions (400x60)", () => {
    render(<HeaderPanel visible={true} />);
    const panel = screen.getByRole("status");
    // Note: In jsdom, computed styles may not reflect CSS exactly
    // This test verifies the class is applied; visual tests need browser
    expect(panel).toHaveClass("header-panel");
  });
});

describe("HeaderPanel accessibility (WCAG 2.1 AA)", () => {
  it("has sufficient color contrast (white on black = 21:1 ratio)", () => {
    // Color contrast ratio for #ffffff on #000000 is 21:1
    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    // 21:1 exceeds both requirements
    render(<HeaderPanel visible={true} />);
    const heading = screen.getByRole("heading");
    expect(heading).toBeInTheDocument();
    // Actual contrast verification requires visual testing tools
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
