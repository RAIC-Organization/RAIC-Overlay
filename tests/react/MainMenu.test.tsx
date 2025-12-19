import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MainMenu } from "../../src/components/MainMenu";

// Mock window events
vi.mock("../../src/lib/windowEvents", () => ({
  windowEvents: {
    emit: vi.fn(),
  },
}));

describe("MainMenu", () => {
  it("renders when mode is 'windowed'", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBe(1);
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Draw")).toBeInTheDocument();
    expect(screen.getByText("Test Windows")).toBeInTheDocument();
  });

  it("renders nothing when mode is 'fullscreen'", () => {
    const { container } = render(<MainMenu visible={true} mode="fullscreen" />);
    expect(container.querySelector('[role="group"]')).toBeNull();
  });

  it("renders nothing when visible is false", () => {
    const { container } = render(<MainMenu visible={false} mode="windowed" />);
    expect(container.querySelector('[role="group"]')).toBeNull();
  });
});

describe("MainMenu button groups", () => {
  it("has one button group", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBe(1);
  });

  it("button group contains Notes, Draw, and Test Windows", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    const group = groups[0];
    expect(group).toContainElement(screen.getByText("Notes"));
    expect(group).toContainElement(screen.getByText("Draw"));
    expect(group).toContainElement(screen.getByText("Test Windows"));
  });
});

describe("MainMenu accessibility", () => {
  it("button groups have role='group' for accessibility", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBeGreaterThan(0);
  });

  it("buttons are focusable", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const button = screen.getByText("Notes");
    expect(button).not.toHaveAttribute("tabindex", "-1");
  });
});
