# Data Model: README v1.0.0 Release Refactor

**Feature Branch**: `059-readme-v1-release`
**Date**: 2026-01-03

## Overview

This feature is a documentation update with no database entities or complex data structures. The "data model" consists of configuration files that require version updates.

## Configuration Entities

### Version Configuration

| File | Field Path | Current Value | Target Value |
|------|------------|---------------|--------------|
| `package.json` | `version` | `"0.1.0"` | `"1.0.0"` |
| `src-tauri/Cargo.toml` | `[package].version` | `"0.1.0"` | `"1.0.0"` |
| `src-tauri/tauri.conf.json` | `version` | `"0.1.0"` | `"1.0.0"` |

### README Sections

| Section | Content Source | Notes |
|---------|---------------|-------|
| Logo | `src-tauri/icons/icon.png` | Centered header image |
| Version Badge | shields.io static badge | `1.0.0` |
| Platform Badge | shields.io static badge | `Windows 11` |
| Ko-fi Button | User-provided HTML | External image from Ko-fi CDN |
| In-game Tip | RSI profile link | Link to `braindaamage` citizen page |
| Screenshots | `screenshots/overlay.png`, `screenshots/settings.png` | Two images |
| License | MIT license text | Standard template |

## No API Contracts

This feature does not introduce or modify any APIs. No contracts directory needed.

## Validation Rules

1. **Version Consistency**: All three configuration files must show `1.0.0`
2. **Image Paths**: All images must use relative paths from repository root
3. **External Links**: Ko-fi and RSI links must be correct and functional
4. **Markdown Validity**: README must render correctly on GitHub
