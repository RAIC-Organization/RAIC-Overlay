/**
 * NotesContent Component Contract
 * Feature: 008-tiptap-notes-component
 * 
 * This file defines the public interface for the NotesContent component.
 * Implementation must adhere to this contract.
 */

import type { Editor } from '@tiptap/react'

/**
 * Props for the NotesContent component
 */
export interface NotesContentProps {
  /**
   * Controls editor behavior based on overlay interaction mode
   * 
   * When true (interaction mode):
   * - Toolbar is visible above editor
   * - Editor content is editable
   * 
   * When false (non-interaction mode):
   * - Toolbar is hidden
   * - Editor content is read-only
   */
  isInteractive: boolean
}

/**
 * Props for the internal NotesToolbar component
 */
export interface NotesToolbarProps {
  /**
   * TipTap editor instance for executing formatting commands
   * May be null during initialization
   */
  editor: Editor | null
}

/**
 * Supported text alignment values
 */
export type TextAlignment = 'left' | 'center' | 'right'

/**
 * Supported heading levels
 */
export type HeadingLevel = 1 | 2 | 3

/**
 * Toolbar button action types
 */
export type ToolbarAction =
  | { type: 'toggleBold' }
  | { type: 'toggleItalic' }
  | { type: 'toggleUnderline' }
  | { type: 'toggleStrike' }
  | { type: 'toggleHeading'; level: HeadingLevel }
  | { type: 'toggleBulletList' }
  | { type: 'toggleOrderedList' }
  | { type: 'setTextAlign'; alignment: TextAlignment }

/**
 * Window open payload for Notes windows
 * Used when emitting 'window:open' event from MainMenu
 */
export interface NotesWindowPayload {
  component: React.ComponentType<NotesContentProps>
  title: 'Notes'
  componentProps: NotesContentProps
  initialWidth?: number
  initialHeight?: number
}
