# Feature Specification: Shadcn Design System Integration with Dark Theme

**Feature Branch**: `002-shadcn-dark-theme`
**Created**: 2025-12-12
**Status**: Draft
**Input**: User description: "Integrate shadcn to the react app for design system, refactor the current components and use this global.css theme in dark mode only"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Design System Foundation (Priority: P1)

As a developer, I need the shadcn design system integrated into the React application so that all UI components follow a consistent, professional design language with the specified dark theme.

**Why this priority**: This is the foundational requirement - without the design system properly integrated, no components can be refactored or themed. All subsequent work depends on this.

**Independent Test**: Can be fully tested by verifying that shadcn is properly installed, configured, and that the dark theme CSS variables are loaded and applied to the application root.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** I inspect the root element, **Then** I see the dark theme CSS variables applied (e.g., `--background: 224 71.4% 4.1%`, `--foreground: 210 20% 98%`)
2. **Given** the shadcn library is installed, **When** I attempt to import a shadcn component, **Then** the import succeeds without errors
3. **Given** the application loads, **When** the page renders, **Then** only dark mode styles are applied (no light mode fallback)

---

### User Story 2 - HeaderPanel Component Refactoring (Priority: P2)

As a user, I need the existing HeaderPanel component to be refactored to use shadcn components so that it matches the dark theme design system and benefits from shadcn's accessibility and styling features.

**Why this priority**: The HeaderPanel is the only visible UI component currently in the application. Refactoring it demonstrates the design system is working correctly.

**Independent Test**: Can be fully tested by visually inspecting the HeaderPanel, verifying it uses shadcn-compatible styling, and confirming the dark theme colors match the specification.

**Acceptance Scenarios**:

1. **Given** the overlay is visible (F3 toggle), **When** I view the HeaderPanel, **Then** it displays with the dark theme colors (using theme CSS variables)
2. **Given** the HeaderPanel is rendered, **When** I inspect the component structure, **Then** it uses shadcn-compatible styling patterns (Tailwind utility classes)
3. **Given** the existing HeaderPanel functionality, **When** the component is refactored, **Then** all current functionality is preserved (visibility toggle, positioning, accessibility attributes)

---

### User Story 3 - Global CSS Theme Application (Priority: P3)

As a developer, I need the provided dark theme CSS variables to be configured as the global theme so that all current and future components automatically inherit the dark color scheme.

**Why this priority**: This ensures long-term consistency. Once the foundation (P1) and initial refactoring (P2) are complete, having the global theme properly configured enables future development.

**Independent Test**: Can be fully tested by adding a new component and verifying it automatically inherits dark theme variables without additional configuration.

**Acceptance Scenarios**:

1. **Given** the global.css contains the dark theme variables, **When** any component uses CSS variables like `hsl(var(--background))`, **Then** the correct dark theme color is applied
2. **Given** the theme is dark mode only, **When** the user's system preference is light mode, **Then** the application still displays in dark mode (no system preference override)
3. **Given** the CSS variables are defined, **When** I reference any standard shadcn variable (background, foreground, card, primary, etc.), **Then** the variable resolves to the specified dark theme value

---

### Edge Cases

- What happens when shadcn components are added that require additional CSS variables not in the provided theme?
  - *Resolution*: The provided theme includes all standard shadcn variables; any missing variables will use sensible defaults from the dark color palette
- How does the transparent overlay background interact with the dark theme?
  - *Resolution*: The overlay root elements (html, body, #root) must remain transparent; only UI components like HeaderPanel receive dark theme backgrounds
- What happens if Tailwind CSS (required by shadcn) conflicts with existing custom CSS?
  - *Resolution*: Existing overlay.css styles will be migrated to Tailwind utilities or integrated with the new theme system

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST install and configure shadcn/ui design system compatible with React 19.2 and Tauri 2.x
- **FR-002**: System MUST apply the provided dark theme CSS variables as the default and only theme
- **FR-003**: System MUST NOT support light mode or system preference theme switching (dark mode only)
- **FR-004**: System MUST refactor the HeaderPanel component to use shadcn-compatible styling (Tailwind utilities)
- **FR-005**: System MUST preserve all existing functionality of the HeaderPanel (visibility toggle via F3, top-center positioning, accessibility attributes)
- **FR-006**: System MUST maintain transparent backgrounds for html, body, and #root elements to preserve overlay behavior
- **FR-007**: System MUST configure Tailwind CSS (shadcn dependency) to work alongside existing application structure
- **FR-008**: System MUST apply the following specific color values from the provided theme:
  - Background: `224 71.4% 4.1%` (HSL)
  - Foreground: `210 20% 98%` (HSL)
  - Primary: `210 20% 98%` (HSL)
  - Border: `215 27.9% 16.9%` (HSL)
  - Radius: `0.5rem`

### Key Entities

- **Theme Configuration**: CSS custom properties (variables) defining colors, spacing, and border radius for the dark theme
- **Design System Components**: shadcn/ui components that consume theme variables and provide consistent UI patterns
- **HeaderPanel**: The existing overlay header component to be refactored to use the design system

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All shadcn component imports resolve without errors and components render correctly
- **SC-002**: The HeaderPanel component displays with the exact dark theme colors specified (visually verifiable)
- **SC-003**: 100% of existing HeaderPanel functionality is preserved after refactoring (visibility toggle, positioning, accessibility)
- **SC-004**: Application displays dark theme regardless of user's system color preference
- **SC-005**: Overlay transparency is maintained - content behind the overlay remains visible through non-UI areas
- **SC-006**: New components added to the application automatically inherit dark theme styling without additional configuration

## Assumptions

- The application uses a standard Vite-based React setup compatible with Tailwind CSS and shadcn
- The provided CSS variable values are complete for the initial component set (HeaderPanel)
- shadcn/ui version compatible with React 19.2 is available
- Tailwind CSS configuration will use the default shadcn setup patterns
- The existing overlay.css can be fully replaced or integrated with Tailwind utilities
