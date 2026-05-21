// RAIC Overlay plugin bootstrap script (Feature 060).
//
// This script is injected into EVERY plugin webview via
// WebviewWindowBuilder::initialization_script(), BEFORE the plugin's own
// HTML/JS executes. It exposes a single global, `window.raic`, that the
// plugin author uses to talk to the host through JSON-RPC v1.
//
// Template placeholders (substituted by the Rust side at window creation):
//   __RAIC_PLUGIN_ID__       — the plugin's manifest id
//   __RAIC_PLUGIN_VERSION__  — the installed version
//   __RAIC_WINDOW_ID__       — primary or secondary window id
//   __RAIC_THEME_TOKENS__    — JSON map of CSS custom properties (string→string)
//
// Authoritative contract: specs/060-plugin-system/contracts/window-raic.d.ts
// + specs/060-plugin-system/contracts/jsonrpc-v1.md

(() => {
  'use strict';

  const PLUGIN_ID = '__RAIC_PLUGIN_ID__';
  const PLUGIN_VERSION = '__RAIC_PLUGIN_VERSION__';
  const WINDOW_ID = '__RAIC_WINDOW_ID__';
  /** @type {Object.<string,string>} */
  const THEME_TOKENS = JSON.parse('__RAIC_THEME_TOKENS__');

  // -------------------------------------------------------------------------
  // CSS theme tokens — injected as :root custom properties so plugin CSS
  // can match the SC HUD aesthetic by referencing var(--raic-bg) etc.
  // -------------------------------------------------------------------------
  function injectThemeTokens(tokens) {
    let cssBody = ':root{';
    for (const [k, v] of Object.entries(tokens)) {
      // Sanitize: token names are constants from the host (--raic-*).
      // Values are CSS strings from the host theme; we trust them.
      cssBody += `${k}:${v};`;
    }
    cssBody += '}';
    const style = document.createElement('style');
    style.id = '__raic-theme-tokens';
    style.textContent = cssBody;
    // documentElement exists even before <head>; appending here is safe pre-load.
    (document.head || document.documentElement).appendChild(style);
  }
  injectThemeTokens(THEME_TOKENS);

  // -------------------------------------------------------------------------
  // RPC client — one Tauri command, plugin_rpc, dispatches by method name.
  // -------------------------------------------------------------------------
  const tauri = window.__TAURI_INTERNALS__;
  if (!tauri || typeof tauri.invoke !== 'function') {
    console.error('[raic] Tauri internals not available — this script must run inside a Tauri plugin webview.');
    return;
  }

  let nextId = 0;

  /**
   * @template T
   * @param {string} method
   * @param {object} [params]
   * @returns {Promise<T>}
   */
  function rpc(method, params) {
    const id = String(++nextId);
    const request = { jsonrpc: '2.0', id, method, params: params || {} };
    return tauri.invoke('plugin_rpc', { pluginId: PLUGIN_ID, request })
      .then((response) => {
        if (response && response.error) {
          const err = new Error(response.error.message || 'rpc error');
          err.code = response.error.code;
          err.data = response.error.data;
          err.name = 'RaicRpcError';
          throw err;
        }
        return response ? response.result : undefined;
      });
  }

  /**
   * Subscribe to a `*.on*` method's events. The returned object's
   * unsubscribe() cancels the subscription on both ends.
   *
   * Note (Phase 2): event delivery from host -> webview is not yet wired.
   * Calling subscribe() registers the listener locally and asks the host
   * for a subscriptionId; events start being delivered once the host
   * begins emitting `raic:event` (added in Phase 4).
   */
  const subscriptions = new Map();

  async function subscribe(method, params, listener) {
    const { subscriptionId } = await rpc(method, params || {});
    subscriptions.set(subscriptionId, listener);
    return {
      subscriptionId,
      async unsubscribe() {
        subscriptions.delete(subscriptionId);
        try {
          await rpc('raic.unsubscribe', { subscriptionId });
        } catch (_) {
          /* idempotent */
        }
      },
    };
  }

  // -------------------------------------------------------------------------
  // Expose the global.
  // -------------------------------------------------------------------------
  Object.defineProperty(window, 'raic', {
    value: Object.freeze({
      protocol: 1,
      pluginId: PLUGIN_ID,
      pluginVersion: PLUGIN_VERSION,
      windowId: WINDOW_ID,
      theme: Object.freeze({ ...THEME_TOKENS }),
      rpc,
      subscribe,
    }),
    writable: false,
    configurable: false,
    enumerable: true,
  });
})();
