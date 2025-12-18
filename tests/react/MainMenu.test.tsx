import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MainMenu } from "../../src/components/MainMenu";

describe("MainMenu", () => {
  it("renders when mode is 'windowed'", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBe(2);
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("renders nothing when mode is 'fullscreen'", () => {
    const { container } = render(<MainMenu visible={true} mode="fullscreen" />);
    expect(container.querySelector('[role="group"]')).toBeNull();
  });

  it("renders nothing when visible is false", () => {
    const { container } = render(<MainMenu visible={false} mode="windowed" />);
    expect(container.querySelector('[role="group"]')).toBeNull();
  });

  it("logs button name to console when button is clicked", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(<MainMenu visible={true} mode="windowed" />);

    // Click Option 1
    fireEvent.click(screen.getByText("Option 1"));
    expect(consoleSpy).toHaveBeenCalledWith("Button clicked: Option 1");

    // Click Option 2
    fireEvent.click(screen.getByText("Option 2"));
    expect(consoleSpy).toHaveBeenCalledWith("Button clicked: Option 2");

    // Click Option 3
    fireEvent.click(screen.getByText("Option 3"));
    expect(consoleSpy).toHaveBeenCalledWith("Button clicked: Option 3");

    consoleSpy.mockRestore();
  });
});

describe("MainMenu button groups", () => {
  it("has two button groups", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    expect(groups.length).toBe(2);
  });

  it("Group 1 contains Option 1 and Option 2", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    const group1 = groups[0];
    expect(group1).toContainElement(screen.getByText("Option 1"));
    expect(group1).toContainElement(screen.getByText("Option 2"));
  });

  it("Group 2 contains Option 3", () => {
    render(<MainMenu visible={true} mode="windowed" />);
    const groups = screen.getAllByRole("group");
    const group2 = groups[1];
    expect(group2).toContainElement(screen.getByText("Option 3"));
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
    const button1 = screen.getByText("Option 1");
    expect(button1).not.toHaveAttribute("tabindex", "-1");
  });
});
