# Data Model: Buy Me A Coffee Button

**Feature**: 053-buymeacoffee-button
**Date**: 2026-01-03

## Summary

This feature does not require a data model. It is a stateless UI component that:
- Renders a button in the Settings panel
- Opens a static external URL when clicked
- Does not persist any data

## Entities

None required.

## Rationale

The Buy Me A Coffee button is a simple pass-through to the system's default browser:
1. User clicks button
2. `openUrl("https://www.buymeacoffee.com/braindaamage")` is called
3. OS opens URL in default browser

No state tracking, no user preferences, no analytics collection - just a direct link.
