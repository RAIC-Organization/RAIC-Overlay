// SC HUD theme tokens exposed to plugin webviews as CSS custom properties.
//
// These mirror the host's CSS variables from app/globals.css (Feature 026).
// They are injected on `:root` by the bootstrap script (T046) so plugin CSS
// can reference `var(--raic-bg)` etc and inherit the SC HUD aesthetic
// without any host SDK.
//
// The exact set is also documented in contracts/window-raic.d.ts
// (RaicCssToken union) and exposed at runtime via the `theme.getTokens`
// JSON-RPC method.

use std::collections::HashMap;

/// Return the current SC HUD theme tokens.
///
/// v1 is a static map. When the host gains a runtime theme switcher
/// (future feature), this becomes dynamic and `theme.onChange`
/// subscribers receive updates.
pub fn current_tokens() -> HashMap<&'static str, String> {
    let mut t = HashMap::new();

    // Backgrounds
    t.insert("--raic-bg", "hsl(220 25% 6%)".to_string());
    t.insert("--raic-bg-deep", "hsl(220 30% 4%)".to_string());
    t.insert("--raic-bg-elevated", "hsl(220 20% 10%)".to_string());
    t.insert("--raic-bg-muted", "hsl(215 25% 14%)".to_string());
    t.insert(
        "--raic-bg-glass",
        "hsla(220, 25%, 6%, 0.55)".to_string(),
    );

    // Foreground
    t.insert("--raic-fg", "hsl(190 60% 90%)".to_string());
    t.insert("--raic-fg-muted", "hsl(210 20% 60%)".to_string());

    // Accent (SC cyan)
    t.insert("--raic-accent", "hsl(190 100% 50%)".to_string());
    t.insert("--raic-accent-strong", "hsl(190 100% 60%)".to_string());

    // Borders
    t.insert("--raic-border", "hsl(190 40% 25%)".to_string());
    t.insert(
        "--raic-border-glass",
        "hsla(190, 40%, 25%, 0.4)".to_string(),
    );

    // Shadows / radius
    t.insert(
        "--raic-shadow",
        "0 0 8px hsla(190, 100%, 50%, 0.25)".to_string(),
    );
    t.insert("--raic-radius", "0.5rem".to_string());
    t.insert("--raic-radius-sm", "0.25rem".to_string());
    t.insert("--raic-radius-lg", "0.75rem".to_string());

    // Typography
    t.insert(
        "--raic-font-display",
        "var(--font-orbitron), system-ui, sans-serif".to_string(),
    );
    t.insert(
        "--raic-font-body",
        "system-ui, -apple-system, sans-serif".to_string(),
    );

    // Spacing
    t.insert("--raic-spacing-unit", "4px".to_string());

    t
}
