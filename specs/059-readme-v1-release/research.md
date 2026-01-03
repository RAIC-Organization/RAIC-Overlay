# Research: README v1.0.0 Release Refactor

**Feature Branch**: `059-readme-v1-release`
**Date**: 2026-01-03

## Research Summary

This feature involves documentation and configuration updates only. No external libraries or complex technical decisions required. Research focuses on:
1. GitHub Markdown rendering patterns
2. Badge/shield services
3. MIT license standard text

---

## R1: GitHub Markdown Image Display

**Decision**: Use relative path `src-tauri/icons/icon.png` for logo display

**Rationale**:
- GitHub renders relative paths from repository root
- Using `src-tauri/icons/icon.png` ensures the logo displays correctly without external hosting
- The 256x256 or 128x128 icon size is appropriate for README headers

**Alternatives Considered**:
- External hosting (imgur, etc.): Rejected - adds dependency, images can disappear
- Raw GitHub URL: Rejected - changes with branches, less portable

---

## R2: Version Badges

**Decision**: Use shields.io badges for version and platform display

**Rationale**:
- shields.io is the de facto standard for GitHub README badges
- Static badges don't require API integration
- Format: `![Version](https://img.shields.io/badge/version-1.0.0-blue)` and `![Platform](https://img.shields.io/badge/platform-Windows%2011-blue)`

**Alternatives Considered**:
- Text-only version display: Less visually appealing
- GitHub release badge: Would show latest release, but we want to show 1.0.0 explicitly

---

## R3: Ko-fi Button HTML in Markdown

**Decision**: Use provided HTML directly in Markdown - GitHub supports inline HTML

**Rationale**:
- GitHub Markdown supports embedded HTML
- The provided Ko-fi button HTML will render correctly
- Centering achieved with `<p align="center">` wrapper

**Alternatives Considered**:
- Markdown image link: Would work but loses styling control
- Ko-fi official embed: More complex, unnecessary for simple donation link

---

## R4: MIT License Text

**Decision**: Include standard MIT license summary in README, reference LICENSE file

**Rationale**:
- Standard practice to have LICENSE file with full text
- README includes brief mention with link to LICENSE
- Full MIT text in LICENSE file (to be created/verified)

**Standard MIT License Text**:
```
MIT License

Copyright (c) 2026 RAIC Organization

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## R5: Screenshot Display

**Decision**: Use relative paths with centered layout

**Rationale**:
- Screenshots exist at `screenshots/overlay.png` and `screenshots/settings.png`
- Use `<p align="center"><img src="..." /></p>` for centered display
- Add descriptive alt text for accessibility

**Alternatives Considered**:
- Side-by-side layout: May not render well on narrow screens
- Plain Markdown images: Less control over sizing and alignment

---

## R6: README Section Order

**Decision**: Follow this section order for optimal user flow

1. Logo header with version/platform badges
2. Ko-fi button + in-game tip link
3. Short description (About)
4. Screenshots
5. Installation
6. Controls
7. Windows & Widgets list
8. License

**Rationale**:
- Logo and branding first for immediate recognition
- Support options visible but not intrusive (header area)
- Description and screenshots show value before asking user to install
- Installation before controls (can't use controls without installing)
- Features last before license (detail for interested users)
- License at bottom (standard convention)

---

## No NEEDS CLARIFICATION Items

All technical decisions resolved. Ready for Phase 1 design artifacts.
