/**
 * Contract: DrawContent Component
 * Feature: 009-excalidraw-draw-component
 *
 * This file defines the API contract for the DrawContent component.
 * Implementation must conform to these interfaces.
 */

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for the DrawContent component.
 *
 * @example
 * <DrawContent isInteractive={true} />
 */
export interface DrawContentProps {
  /**
   * Whether the overlay is in interaction mode (windowed mode).
   *
   * - true: Canvas is editable, Excalidraw toolbar is visible
   * - false: Canvas is view-only, toolbar is hidden
   *
   * This prop is passed from the window system and updates when
   * the user toggles mode with F5.
   */
  isInteractive: boolean;
}

// =============================================================================
// Component Contract
// =============================================================================

/**
 * DrawContent Component Contract
 *
 * The component MUST:
 * - Accept DrawContentProps as its only props
 * - Render an Excalidraw canvas that fills its container
 * - Show Excalidraw toolbar when isInteractive=true
 * - Hide Excalidraw toolbar when isInteractive=false
 * - Enable canvas editing when isInteractive=true
 * - Disable canvas editing (view-only) when isInteractive=false
 * - Use dark theme (THEME.DARK)
 * - Disable theme toggle in Excalidraw UI
 * - Create independent state per instance
 * - Discard all state on unmount (no persistence)
 *
 * The component MUST NOT:
 * - Persist drawing state to storage
 * - Share state between instances
 * - Allow light theme
 * - Enable file save/load operations
 */

// =============================================================================
// Window Event Payload Contract
// =============================================================================

/**
 * Payload for opening a Draw window via windowEvents.
 *
 * @example
 * windowEvents.emit('window:open', {
 *   component: DrawContent,
 *   title: 'Draw',
 *   componentProps: { isInteractive: mode === 'windowed' },
 * });
 */
export interface DrawWindowPayload {
  /** The DrawContent component reference */
  component: React.ComponentType<DrawContentProps>;

  /** Window title - always "Draw" */
  title: 'Draw';

  /** Props to pass to DrawContent */
  componentProps: DrawContentProps;
}

// =============================================================================
// Menu Button Contract
// =============================================================================

/**
 * Main Menu Draw Button Contract
 *
 * The button MUST:
 * - Display label "Draw"
 * - Be positioned after Notes button, before Test Windows button
 * - Emit 'window:open' event with DrawWindowPayload on click
 * - Use consistent styling with other menu buttons (variant="secondary")
 * - Only be visible in interaction mode (windowed)
 */
