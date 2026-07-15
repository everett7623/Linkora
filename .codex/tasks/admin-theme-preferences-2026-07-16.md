# Admin Theme Preferences - 2026-07-16

## Status

Completed in Linketry v0.17.0.

## Delivered

- [x] Added light, dark, and system-following theme preferences stored per browser.
- [x] Applied the resolved theme before React renders to avoid a mismatched color flash.
- [x] Converted Slate and brand palettes to theme-aware design tokens across the existing Admin.
- [x] Added high-contrast light-theme semantic colors and browser chrome color updates.
- [x] Preserved density, Simple/Advanced mode, optional-module visibility, and EN/ZH behavior.
- [x] Added unit and real-browser persistence, computed-color, and system-mode coverage.

## Safety

- No Worker routes, D1 schema, KV behavior, redirect handling, or analytics code changed.
- Theme state is browser-local and is not an authorization or instance configuration boundary.
