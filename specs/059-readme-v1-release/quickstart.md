# Quickstart: README v1.0.0 Release Refactor

**Feature Branch**: `059-readme-v1-release`
**Date**: 2026-01-03

## Prerequisites

- Git repository cloned
- Text editor (VS Code, Notepad++, etc.)
- No build tools required - documentation only

## Implementation Steps

### Step 1: Update Version Numbers (3 files)

1. **package.json** (line 4):
   ```json
   "version": "1.0.0",
   ```

2. **src-tauri/Cargo.toml** (line 3):
   ```toml
   version = "1.0.0"
   ```

3. **src-tauri/tauri.conf.json** (line 5):
   ```json
   "version": "1.0.0",
   ```

### Step 2: Rewrite README.md

Replace entire README.md content with the new user-friendly structure:

```markdown
# RAIC Overlay

<p align="center">
  <img src="src-tauri/icons/icon.png" alt="RAIC Overlay Logo" width="128" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/platform-Windows%2011-blue" alt="Windows 11" />
</p>

<p align="center">
  <a href="https://ko-fi.com/Y8Y01QVRYF" target="_blank">
    <img height="36" src="https://storage.ko-fi.com/cdn/kofi3.png?v=6" alt="Buy Me a Coffee" />
  </a>
</p>

<p align="center">
  or send me a aUEC Tip in game to my nickname <a href="https://robertsspaceindustries.com/en/citizens/braindaamage">braindaamage</a>
</p>

---

## About

RAIC Overlay is a customizable overlay for Star Citizen...
[Continue with full content per spec]
```

### Step 3: Verify Rendering

1. Commit changes to feature branch
2. Push to GitHub
3. View README.md on GitHub to verify:
   - Logo displays correctly
   - Badges render
   - Ko-fi button is clickable
   - Screenshots display
   - All links work

## Key Files

| File | Action |
|------|--------|
| `README.md` | Complete rewrite |
| `package.json` | Version field update |
| `src-tauri/Cargo.toml` | Version field update |
| `src-tauri/tauri.conf.json` | Version field update |

## Testing Checklist

- [ ] Logo image loads from `src-tauri/icons/icon.png`
- [ ] Version badge shows `1.0.0`
- [ ] Platform badge shows `Windows 11`
- [ ] Ko-fi button links to correct Ko-fi page
- [ ] "braindaamage" links to RSI citizen profile
- [ ] Both screenshots display correctly
- [ ] All section headings are properly formatted
- [ ] License section appears at bottom
- [ ] No developer/build instructions remain
