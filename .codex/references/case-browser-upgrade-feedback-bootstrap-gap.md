# Case: Upgrade Feedback Fix Cannot Bootstrap From Its Source Build

Date: 2026-07-20

## Symptom

The production workflow deploys the release successfully, but the already-open Admin returns to the ordinary update action after its fallback reload. The target release is live, yet the page neither refreshes again nor shows completion.

## Evidence

- Workflow run `29728335970` and production deployment `5518928695` successfully deployed v0.27.6.
- Cache-bypassed production `/health` and Admin HTML both reported v0.27.6.
- The operator screenshot still reported v0.27.5 and offered v0.27.6 again.
- The v0.27.5 source has one finalizing reload but no upgrade-feedback persistence; that persistence first exists in the v0.27.6 target.

## Root Cause

The first implementation was validated with one compiled build pretending to upgrade to a future version. That proved the new logic after it was already present, but did not model the real source/target boundary. An already-running source build cannot execute feedback code that exists only in the target build. If its single reload receives stale Pages assets, it has no second-stage state.

## Fix

- Keep explicit same-tab session feedback as the primary path for builds that support it.
- Record the last successfully loaded Admin build version without credentials.
- When explicit feedback is absent, infer completion from an older recorded build version.
- For the one-time bootstrap from older source builds, require both a real browser reload and a fresh anonymous update cache whose target exactly matches the loaded build.
- Persist inferred completion in the current tab so dismissal and repeated refreshes remain deterministic.
- Do not infer completion on ordinary navigation, a fresh install, or an unchanged build.

## Verification

- Unit tests cover older-build detection, reload-bound cache bridging, fresh navigation, unchanged builds, and session precedence.
- Browser tests reproduce an old source cache without the new marker, reload the target build, and verify the completion notice.
- The existing manual update-check regression confirms ordinary navigation is not misclassified.
