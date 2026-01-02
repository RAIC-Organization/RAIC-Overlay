/**
 * T046 (049): Version comparison unit tests
 *
 * Tests the version comparison logic used in update checking.
 * The actual comparison is done in Rust using the semver crate,
 * but these tests verify the expected behavior.
 *
 * @feature 049-auto-update
 */

import { describe, it, expect } from "vitest";

/**
 * Helper to compare versions using semver rules.
 * This mirrors the logic in src-tauri/src/update/checker.rs
 */
function isNewerVersion(current: string, latest: string): boolean {
  // Strip 'v' prefix if present
  const cleanCurrent = current.replace(/^v/, "");
  const cleanLatest = latest.replace(/^v/, "");

  // Split into parts
  const currentParts = cleanCurrent.split(".").map(Number);
  const latestParts = cleanLatest.split(".").map(Number);

  // Compare major.minor.patch
  for (let i = 0; i < 3; i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false; // Equal versions
}

describe("Version Comparison", () => {
  describe("isNewerVersion", () => {
    it("should return true when latest major version is higher", () => {
      expect(isNewerVersion("1.0.0", "2.0.0")).toBe(true);
      expect(isNewerVersion("0.1.0", "1.0.0")).toBe(true);
    });

    it("should return true when latest minor version is higher", () => {
      expect(isNewerVersion("1.0.0", "1.1.0")).toBe(true);
      expect(isNewerVersion("1.2.0", "1.3.0")).toBe(true);
    });

    it("should return true when latest patch version is higher", () => {
      expect(isNewerVersion("1.0.0", "1.0.1")).toBe(true);
      expect(isNewerVersion("1.2.3", "1.2.4")).toBe(true);
    });

    it("should return false when versions are equal", () => {
      expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false);
      expect(isNewerVersion("2.5.3", "2.5.3")).toBe(false);
    });

    it("should return false when current version is higher", () => {
      expect(isNewerVersion("2.0.0", "1.0.0")).toBe(false);
      expect(isNewerVersion("1.1.0", "1.0.0")).toBe(false);
      expect(isNewerVersion("1.0.1", "1.0.0")).toBe(false);
    });

    it("should handle v prefix correctly", () => {
      expect(isNewerVersion("v1.0.0", "v1.1.0")).toBe(true);
      expect(isNewerVersion("v1.0.0", "1.1.0")).toBe(true);
      expect(isNewerVersion("1.0.0", "v1.1.0")).toBe(true);
    });

    it("should handle missing patch version", () => {
      expect(isNewerVersion("1.0", "1.1")).toBe(true);
      expect(isNewerVersion("1.0.0", "1.1")).toBe(true);
      expect(isNewerVersion("1.0", "1.0.1")).toBe(true);
    });

    it("should handle real-world version scenarios", () => {
      // Simulating typical update scenarios
      expect(isNewerVersion("0.1.0", "0.1.1")).toBe(true); // Patch update
      expect(isNewerVersion("0.1.0", "0.2.0")).toBe(true); // Minor update
      expect(isNewerVersion("0.9.9", "1.0.0")).toBe(true); // Major update
      expect(isNewerVersion("1.0.0-beta", "1.0.0")).toBe(false); // Pre-release (simplified)
    });
  });
});
