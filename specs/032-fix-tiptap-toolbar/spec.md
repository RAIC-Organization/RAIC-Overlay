# Feature Specification: Fix TipTap Notes Toolbar

**Feature Branch**: `032-fix-tiptap-toolbar`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Fix the notes windows content, this use tiptap and custom toolbar, but the 'H' buttons and the list buttons in the toolbar don't work, the H button don't change the text size and the list don't make lists, les try to understand deeply how this toolbar and tiptap work and fix this issues"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply Heading Formatting (Priority: P1)

A user opens a Notes window and wants to create a heading for their notes. They type some text, select it (or place cursor on the line), and click the H1/H2/H3 button in the toolbar. The text should visually change to display as a heading with appropriate larger font size and styling.

**Why this priority**: Headings are fundamental for organizing notes. Without working heading buttons, users cannot structure their content, making the notes feature significantly less useful.

**Independent Test**: Can be fully tested by opening a Notes window, typing text, clicking H1 button, and visually verifying the text becomes a heading with larger font size.

**Acceptance Scenarios**:

1. **Given** a Notes window is open with text entered, **When** the user clicks the H1 button, **Then** the current line/selection becomes a level-1 heading with visibly larger font size
2. **Given** a Notes window with existing paragraph text, **When** the user clicks H2 button, **Then** the text converts to a level-2 heading with medium-large font size
3. **Given** a Notes window with existing paragraph text, **When** the user clicks H3 button, **Then** the text converts to a level-3 heading with slightly larger font size
4. **Given** text is already formatted as H1, **When** the user clicks H1 button again, **Then** the heading is toggled back to normal paragraph text
5. **Given** text is formatted as H1, **When** the user clicks H2 button, **Then** the heading level changes from H1 to H2

---

### User Story 2 - Create Bullet Lists (Priority: P1)

A user wants to create a bullet point list in their notes. They type some text, place their cursor on the line, and click the bullet list button. The text should become the first item in a bulleted list. Pressing Enter should create the next bullet item.

**Why this priority**: Lists are essential for note-taking and organizing information. Users expect list functionality to work in any notes/text editor application.

**Independent Test**: Can be fully tested by opening a Notes window, typing text, clicking the bullet list button, and verifying a bullet appears before the text.

**Acceptance Scenarios**:

1. **Given** a Notes window is open with text entered, **When** the user clicks the bullet list button, **Then** the current line becomes a bullet list item with a visible bullet marker
2. **Given** a bullet list item exists, **When** the user presses Enter, **Then** a new bullet list item is created on the next line
3. **Given** an empty bullet list item, **When** the user presses Enter or Backspace, **Then** the list formatting is removed and returns to normal paragraph
4. **Given** text is already a bullet list, **When** the user clicks the bullet list button again, **Then** the list formatting is toggled off

---

### User Story 3 - Create Numbered Lists (Priority: P2)

A user wants to create a numbered/ordered list in their notes. They type some text and click the numbered list button. The text should become item "1." in an ordered list. Subsequent items should be numbered automatically.

**Why this priority**: Ordered lists are commonly used for step-by-step instructions, priorities, and sequences. Important but slightly less common than bullet lists.

**Independent Test**: Can be fully tested by opening a Notes window, typing text, clicking the ordered list button, and verifying "1." appears before the text.

**Acceptance Scenarios**:

1. **Given** a Notes window is open with text entered, **When** the user clicks the ordered list button, **Then** the current line becomes a numbered list item starting with "1."
2. **Given** a numbered list with item "1.", **When** the user presses Enter and types new text, **Then** the new item is automatically numbered "2."
3. **Given** text is already an ordered list, **When** the user clicks the ordered list button again, **Then** the numbered list formatting is toggled off

---

### User Story 4 - Visual Feedback on Active Formatting (Priority: P3)

When the user places their cursor inside formatted text (e.g., a heading or list), the corresponding toolbar button should show an active/highlighted state to indicate the current formatting.

**Why this priority**: Visual feedback is important for user experience but not critical for core functionality.

**Independent Test**: Can be tested by placing cursor inside a heading and verifying the corresponding H button appears highlighted in the toolbar.

**Acceptance Scenarios**:

1. **Given** the cursor is inside a level-1 heading, **When** the user looks at the toolbar, **Then** the H1 button appears highlighted/active
2. **Given** the cursor is inside a bullet list, **When** the user looks at the toolbar, **Then** the bullet list button appears highlighted/active
3. **Given** the cursor is in normal paragraph text, **When** the user looks at the toolbar, **Then** no heading or list buttons appear highlighted

---

### Edge Cases

- What happens when the user applies heading formatting to text already in a list? (Expected: list structure may be removed, heading applied)
- How does the system handle applying list formatting to a heading? (Expected: heading remains, list structure wraps the heading)
- What happens when multiple lines are selected and list button is clicked? (Expected: each line becomes a list item)
- How do headings and lists render when the Notes window is in read-only mode (click-through mode)? (Expected: formatting preserved and visible)

## Requirements *(mandatory)*

### Functional Requirements

**Visual Styling (This Fix)**:
- **FR-001**: System MUST render heading text (H1, H2, H3) with visually distinct, larger font sizes when heading formatting is applied
- **FR-002**: System MUST render bullet lists with visible bullet markers (disc/circle symbols) with proper indentation
- **FR-003**: System MUST render ordered lists with visible numbers (1., 2., 3.) with proper indentation

**Pre-existing Functionality (Verify Only)**:
- **FR-004**: System MUST toggle heading formatting on/off when the same heading button is clicked *(already working via TipTap commands)*
- **FR-005**: System MUST toggle list formatting on/off when the same list button is clicked *(already working via TipTap commands)*
- **FR-006**: System MUST show active/highlighted state on toolbar buttons when cursor is in formatted text *(existing data-active implementation)*
- **FR-007**: System MUST persist heading and list formatting when content is saved and restored *(uses existing persistence system)*
- **FR-008**: System MUST continue to work with existing text formatting (bold, italic, underline, strikethrough, alignment) *(no changes to existing formatting)*

### Key Entities

- **TipTap Editor**: The rich text editor instance managing document state and commands
- **Toolbar Buttons**: UI controls that trigger TipTap formatting commands
- **Document Node Types**: Heading nodes (levels 1-3), BulletList nodes, OrderedList nodes, ListItem nodes
- **CSS Styles**: Visual styling that must be applied to formatted content to make it visible

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and see visually distinct headings in 100% of attempts (H1 larger than H2 larger than H3 larger than paragraph)
- **SC-002**: Users can create and see bulleted lists with visible markers in 100% of attempts
- **SC-003**: Users can create and see numbered lists with visible numbers in 100% of attempts
- **SC-004**: Toolbar active states correctly reflect cursor position 100% of the time
- **SC-005**: All existing formatting features (bold, italic, underline, strikethrough, alignment) continue to work after fix
- **SC-006**: Formatted content (headings, lists) persists correctly after window close and reopen

## Technical Investigation Summary

Based on codebase analysis, the root cause is likely:

1. **Missing Typography Plugin**: The `@tailwindcss/typography` package is NOT installed, but `prose` classes are used in `NotesContent.tsx` to style the editor content. Without this plugin, heading and list styles from TipTap are not visually rendered (no CSS rules for `h1`, `h2`, `h3`, `ul`, `ol`, `li` elements).

2. **Current Implementation Details**:
   - `NotesContent.tsx`: Uses `useEditor` with `StarterKit` configured for headings and lists
   - `NotesToolbar.tsx`: Correctly calls `editor.chain().focus().toggleHeading({ level: X }).run()` and list commands
   - CSS styling relies on Tailwind `prose prose-sm dark:prose-invert` classes which require `@tailwindcss/typography`

3. **The TipTap commands are likely working correctly** (toggling the underlying node types), but the **visual styling is missing** because the typography plugin that provides heading/list styles is not installed.

## Assumptions

- The TipTap extension configuration (StarterKit with heading/list support) is correct
- The toolbar button click handlers are correctly invoking TipTap commands
- The issue is purely visual/CSS-related, not functional
- Installing or configuring proper typography styles will resolve the issue
