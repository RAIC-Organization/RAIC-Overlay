# Research: Browser Component

**Date**: 2025-12-20
**Branch**: 014-browser-component

## Research Questions

1. How to configure Tauri 2.x CSP to allow iframe loading of external websites?
2. How to implement iframe zoom using CSS transform: scale()?
3. Best practices for iframe navigation history management in React

---

## 1. Iframe and CSP Configuration in Tauri 2.x

### Decision
Configure Tauri's CSP in `tauri.conf.json` to allow iframe loading of external content, with appropriate security warnings and limitations documented.

### Rationale
Tauri restricts Content Security Policy by default for security. To load external websites in an iframe, the CSP must explicitly allow external sources via `frame-src` directive.

### Key Findings

**Tauri CSP Configuration** ([Tauri Security Docs](https://v2.tauri.app/security/csp/)):
- CSP is configured in `tauri.conf.json` under `app.security.csp`
- Tauri auto-injects nonces and hashes for bundled assets at compile time
- External sources must be explicitly allowed

**Required CSP Changes**:
```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src https: http:; img-src 'self' data: https: http:"
    }
  }
}
```

**Security Implications** ([Tauri Capabilities](https://v2.tauri.app/security/capabilities/)):
- On Linux and Android, Tauri cannot distinguish between requests from an embedded `<iframe>` and the window itself
- Some websites block iframe embedding via `X-Frame-Options` or `frame-ancestors` CSP directive (server-side, cannot be bypassed)
- This is expected behavior and documented in the spec as a known limitation

**Alternatives Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Allow all frame sources (`frame-src *`) | Maximum compatibility | Security risk, allows any origin |
| Allow only https (`frame-src https:`) | Good security, most sites work | HTTP sites won't load |
| Whitelist specific domains | Most secure | Limits user flexibility |

**Selected Approach**: `frame-src https: http:` - allows all HTTP/HTTPS sources, giving users flexibility while maintaining basic protocol restrictions.

---

## 2. CSS Transform Scale for Iframe Zoom

### Decision
Use `transform: scale()` with `transform-origin: 0 0` for iframe zoom, wrapped in a container that adjusts dimensions.

### Rationale
CSS `transform: scale()` is the standard approach for iframe scaling with excellent browser support and better performance than the `zoom` property.

### Key Findings

**Transform vs Zoom** ([CSS-Tricks](https://css-tricks.com/almanac/properties/z/zoom/), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/zoom)):
- `transform: scale()` uses GPU compositing layer = better performance
- `zoom` causes layout reflows = worse performance
- `transform` doesn't affect layout (element keeps original space)
- `zoom` affects layout and may move other elements

**Implementation Pattern** ([W3Docs](https://www.w3docs.com/snippets/css/how-to-scale-the-content-of-iframe-element.html), [CodePen Reference](https://codepen.io/herschel666/post/scaling-iframes-css-transforms)):
```css
.iframe-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.scaled-iframe {
  transform: scale(0.5); /* 50% zoom */
  transform-origin: 0 0; /* Scale from top-left */
  width: 200%;  /* Compensate: 100% / 0.5 = 200% */
  height: 200%; /* Compensate: 100% / 0.5 = 200% */
}
```

**Key Considerations**:
- `transform-origin: 0 0` ensures scaling from top-left corner
- Container must have `overflow: hidden` to clip scaled content
- Iframe dimensions must be inversely proportional to scale factor:
  - 50% scale → 200% width/height
  - 100% scale → 100% width/height
  - 200% scale → 50% width/height
- Formula: `dimension = 100% / scaleFactor`

**Performance Note** ([Jake Archibald](https://jakearchibald.com/2025/animating-zooming/)):
- Transform animations should use `translate` before `scale` to avoid non-linear effects
- For static zoom (our use case), order doesn't matter

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| CSS `zoom` property | Simpler, affects layout | Causes reflows, worse performance |
| `transform: scale()` | GPU accelerated, smooth | Requires dimension compensation |
| Browser zoom APIs | Native zoom | Not available for iframes |

**Selected Approach**: `transform: scale()` with dimension compensation.

---

## 3. React Iframe Navigation History Management

### Decision
Implement custom in-memory history stack using React state, tracking URLs as user navigates.

### Rationale
Standard browser history APIs (`window.history`) don't apply to cross-origin iframes. We must maintain our own history tracking.

### Key Findings

**Cross-Origin Limitations**:
- Cannot access `iframe.contentWindow.history` for cross-origin content
- Cannot detect URL changes inside cross-origin iframes via JavaScript
- Must track navigation at the address bar level (when user submits URLs)

**Implementation Pattern**:
```typescript
interface BrowserState {
  url: string;
  historyStack: string[];  // Past URLs
  historyIndex: number;    // Current position in stack
  zoom: number;            // Zoom percentage (10-200)
  isLoading: boolean;
}

// Navigation actions
const navigateTo = (url: string) => {
  // Truncate forward history, add new URL
  const newStack = [...historyStack.slice(0, historyIndex + 1), url];
  setHistoryStack(newStack);
  setHistoryIndex(newStack.length - 1);
  setUrl(url);
};

const goBack = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1);
    setUrl(historyStack[historyIndex - 1]);
  }
};

const goForward = () => {
  if (historyIndex < historyStack.length - 1) {
    setHistoryIndex(historyIndex + 1);
    setUrl(historyStack[historyIndex + 1]);
  }
};
```

**Limitations**:
- Cannot detect in-page navigation (user clicking links inside iframe)
- History only tracks explicit address bar navigations
- This is acceptable per spec: history is session-only and simplified

**Loading State Detection**:
- Use iframe `onLoad` event to detect when page finishes loading
- Set `isLoading: true` when URL changes, `false` on load complete

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Use iframe history API | Native browser behavior | Blocked by cross-origin policy |
| Custom history stack | Full control, works cross-origin | Doesn't track in-page navigation |
| Tauri webview instead of iframe | Full control | Significant complexity, overkill |

**Selected Approach**: Custom in-memory history stack with explicit URL tracking.

---

## 4. URL Validation and Protocol Handling

### Decision
Implement simple URL normalization that prepends `https://` when no protocol is provided.

### Implementation
```typescript
const normalizeUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Already has protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Add https:// prefix
  return `https://${trimmed}`;
};
```

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| CSP Configuration | `frame-src https: http:` | Balance security with user flexibility |
| Zoom Implementation | CSS `transform: scale()` | GPU accelerated, better performance |
| History Management | Custom React state stack | Cross-origin iframe limitations |
| URL Normalization | Prepend `https://` if missing | Simple, secure default |

## Sources

- [Tauri CSP Documentation](https://v2.tauri.app/security/csp/)
- [Tauri Security Configuration](https://v2.tauri.app/reference/config/)
- [Tauri Capabilities - Remote API Access](https://v2.tauri.app/security/capabilities/)
- [CSS zoom - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/zoom)
- [CSS-Tricks Zoom Almanac](https://css-tricks.com/almanac/properties/z/zoom/)
- [Scaling iframes with CSS Transforms - CodePen](https://codepen.io/herschel666/post/scaling-iframes-css-transforms)
- [W3Docs - Scale iframe Content](https://www.w3docs.com/snippets/css/how-to-scale-the-content-of-iframe-element.html)
- [Jake Archibald - Animating Zooming](https://jakearchibald.com/2025/animating-zooming/)
