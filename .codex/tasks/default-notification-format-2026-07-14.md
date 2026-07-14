# Default Notification Format - 2026-07-14

## Status

Complete and verified locally for Linkora 0.9.20.

## Scope

- [x] Replace terse target health messages with complete built-in failure and recovery formats.
- [x] Include the short link, target URL, status, HTTP status, response time, and an explicit UTC detection time.
- [x] Preserve plain-text delivery across Telegram, Discord, Slack, Feishu, DingTalk, and WeCom.
- [x] Keep notification credentials, channel enablement, health decisions, and redirect behavior unchanged.
- [x] Add focused notification-format regression tests.
- [x] Synchronize release metadata and project status documents.

## Verification

- [x] Worker notification tests pass (3/3 focused; 35/35 full suite).
- [x] Worker type-check passes.
- [x] Admin production build passes.
- [x] Release metadata and documentation literals are synchronized.
