/**
 * T048 (049): Update flow integration tests
 *
 * Tests the complete update notification flow with mocked Tauri commands.
 * Verifies that the UI correctly handles different update states.
 *
 * @feature 049-auto-update
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UpdateNotification } from "@/components/update/UpdateNotification";
import type { UpdateInfo, UpdateUIState } from "@/types/update";

// Mock motion/react to avoid animation issues in tests
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe("UpdateNotification Component", () => {
  const mockUpdateInfo: UpdateInfo = {
    version: "1.1.0",
    currentVersion: "1.0.0",
    downloadUrl: "https://github.com/Logianer/RAICOverlay/releases/download/v1.1.0/raic-overlay-1.1.0.msi",
    downloadSize: 15728640, // 15 MB
    releaseUrl: "https://github.com/Logianer/RAICOverlay/releases/tag/v1.1.0",
  };

  const defaultProps = {
    visible: true,
    updateInfo: mockUpdateInfo,
    uiState: "available" as UpdateUIState,
    downloadProgress: null,
    error: null,
    onAccept: vi.fn(),
    onLater: vi.fn(),
    onDismiss: vi.fn(),
    onRetry: vi.fn(),
    onOpenReleasePage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should render when visible is true", () => {
      render(<UpdateNotification {...defaultProps} />);
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("should not render when visible is false", () => {
      render(<UpdateNotification {...defaultProps} visible={false} />);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should not render when updateInfo is null", () => {
      render(<UpdateNotification {...defaultProps} updateInfo={null} />);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  describe("Available State", () => {
    it("should display version information", () => {
      render(<UpdateNotification {...defaultProps} />);
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
      expect(screen.getByText(/v1\.1\.0/)).toBeInTheDocument();
    });

    it("should display download size", () => {
      render(<UpdateNotification {...defaultProps} />);
      expect(screen.getByText(/15\.0 MB/)).toBeInTheDocument();
    });

    it("should show Update Now button", () => {
      render(<UpdateNotification {...defaultProps} />);
      expect(screen.getByRole("button", { name: /update now/i })).toBeInTheDocument();
    });

    it("should show Ask Again Later button", () => {
      render(<UpdateNotification {...defaultProps} />);
      expect(screen.getByRole("button", { name: /ask again later/i })).toBeInTheDocument();
    });

    it("should call onAccept when Update Now is clicked", () => {
      render(<UpdateNotification {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: /update now/i }));
      expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
    });

    it("should call onLater when Ask Again Later is clicked", () => {
      render(<UpdateNotification {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: /ask again later/i }));
      expect(defaultProps.onLater).toHaveBeenCalledTimes(1);
    });

    it("should call onDismiss when X button is clicked", () => {
      render(<UpdateNotification {...defaultProps} />);
      fireEvent.click(screen.getByRole("button", { name: /close/i }));
      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("Downloading State", () => {
    it("should show progress bar during download", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="downloading"
          downloadProgress={{ bytesDownloaded: 5242880, totalBytes: 15728640 }}
        />
      );
      // Progress bar should be present with bytes downloaded
      // Note: "5.0 MB / 15.0 MB" text exists in the progress component
      expect(screen.getByText(/33%/)).toBeInTheDocument();
      // Verify the progress text contains the byte count
      expect(screen.getByText(/5\.0 MB.*15\.0 MB/)).toBeInTheDocument();
    });

    it("should hide action buttons during download", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="downloading"
          downloadProgress={{ bytesDownloaded: 0, totalBytes: 15728640 }}
        />
      );
      expect(screen.queryByRole("button", { name: /update now/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ask again later/i })).not.toBeInTheDocument();
    });

    it("should disable X button during download", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="downloading"
          downloadProgress={{ bytesDownloaded: 0, totalBytes: 15728640 }}
        />
      );
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeDisabled();
    });
  });

  describe("Installing State", () => {
    it("should show launching message", () => {
      render(<UpdateNotification {...defaultProps} uiState="installing" />);
      expect(screen.getByText(/launching installer/i)).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="error"
          error="Download failed: network error"
        />
      );
      expect(screen.getByText(/download failed: network error/i)).toBeInTheDocument();
    });

    it("should show Retry Download button", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="error"
          error="Download failed"
        />
      );
      expect(screen.getByRole("button", { name: /retry download/i })).toBeInTheDocument();
    });

    it("should show Manual Download button", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="error"
          error="Download failed"
        />
      );
      expect(screen.getByRole("button", { name: /manual download/i })).toBeInTheDocument();
    });

    it("should call onRetry when Retry Download is clicked", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="error"
          error="Download failed"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /retry download/i }));
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenReleasePage when Manual Download is clicked", () => {
      render(
        <UpdateNotification
          {...defaultProps}
          uiState="error"
          error="Download failed"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /manual download/i }));
      expect(defaultProps.onOpenReleasePage).toHaveBeenCalledTimes(1);
    });
  });
});
