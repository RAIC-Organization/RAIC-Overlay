/**
 * TypeScript ambient declarations for the `window.raic` global that the host
 * injects into every plugin webview before the plugin's own scripts run.
 *
 * Plugin authors who write TypeScript can drop this file into their project and
 * reference it via `/// <reference types="./window-raic" />`. Plugin authors who
 * write plain JavaScript can ignore it — the runtime object exists either way.
 *
 * This file is part of RAIC Overlay Plugin Protocol v1 and is treated as a
 * stable public contract (see jsonrpc-v1.md "Stability guarantee").
 */

declare global {
  interface Window {
    raic: RaicGlobal;
  }
}

export interface RaicGlobal {
  /** The protocol version this host injected. Currently always 1. */
  readonly protocol: 1;

  /** This plugin's id, as declared in its manifest. */
  readonly pluginId: string;

  /** This plugin's installed version, semver. */
  readonly pluginVersion: string;

  /** The window id of the webview this script is running in (primary or secondary). */
  readonly windowId: string;

  /**
   * Invoke a JSON-RPC method on the host. Resolves with the `result` field of a
   * successful response; rejects with a `RaicRpcError` on any error response.
   *
   * @param method One of the documented JSON-RPC v1 method names (e.g. "state.set").
   * @param params Method-specific parameters (default `{}`).
   * @param options Per-call options. `timeoutMs` only affects `sidecar.call`.
   */
  rpc<TResult = unknown>(
    method: string,
    params?: Record<string, unknown>,
    options?: { timeoutMs?: number }
  ): Promise<TResult>;

  /**
   * Subscribe to events from any `*.on*` method. The returned object's
   * `unsubscribe()` cancels the subscription.
   */
  subscribe<TEvent = unknown>(
    method: string,
    params: Record<string, unknown>,
    listener: (event: TEvent) => void
  ): Promise<RaicSubscription>;

  /** The current theme tokens at the moment of injection. Updated on theme changes. */
  readonly theme: Readonly<Record<string, string>>;
}

export interface RaicSubscription {
  readonly subscriptionId: string;
  unsubscribe(): Promise<void>;
}

export class RaicRpcError extends Error {
  readonly code: number;
  readonly data?: unknown;
}

/**
 * CSS custom properties injected on `:root` by the host, mirroring the SC HUD
 * theme tokens. Plugin CSS may reference any of these to inherit the host look.
 * The exact set is also returned by `theme.getTokens` at runtime.
 */
export type RaicCssToken =
  | "--raic-bg"               // primary background color
  | "--raic-bg-elevated"      // elevated surface background
  | "--raic-bg-glass"         // glassmorphism backdrop
  | "--raic-fg"               // primary foreground / text
  | "--raic-fg-muted"         // muted text
  | "--raic-accent"           // accent / interactive color
  | "--raic-accent-strong"    // accent emphasis
  | "--raic-border"           // standard border
  | "--raic-border-glass"     // glass surface border
  | "--raic-shadow"           // standard drop shadow
  | "--raic-radius"           // standard border radius
  | "--raic-radius-sm"
  | "--raic-radius-lg"
  | "--raic-font-display"     // Orbitron (display font)
  | "--raic-font-body"        // body font
  | "--raic-spacing-unit";    // base spacing unit (typically 4px)
