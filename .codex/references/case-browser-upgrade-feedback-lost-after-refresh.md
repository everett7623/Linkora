# Case: Successful Upgrade Loses Its Result After Admin Refresh

Date: 2026-07-20

## Symptom

The protected workflow deploys the target release successfully. The first automatic refresh can still load the previous Cloudflare Pages assets and show the normal update action again. A later manual refresh loads the new version, but no upgrade-complete message appears.

## Evidence

- Workflow run `29725992523` completed successfully for v0.27.5.
- GitHub deployment `5518487300` recorded the same commit under `production`.
- Production Worker health and a fresh Admin page both reported v0.27.5.
- The first refreshed page still reported v0.27.4 and offered v0.27.5 again; the next manual refresh loaded v0.27.5 without a completion notice.

## Root Cause

The workflow phase was held only in React component memory. A navigation discarded that state. Cloudflare Pages propagation could return the previous HTML/assets on the first reload, so the remounted update checker legitimately detected the target as still newer and presented a duplicate deployment action. Once the new bundle loaded, there was no prior-upgrade context left to confirm success.

## Fix

- After workflow success, store only the normalized target version, timestamp, and bounded-refresh flag in tab-scoped `sessionStorage`.
- On a stale refreshed build, suppress duplicate deployment dispatch, explain that deployment is complete, and schedule one follow-up refresh.
- If the bounded retry remains stale, keep an explicit manual refresh action without creating a refresh loop.
- When the target bundle loads, show a dismissible upgrade-complete confirmation and clear the record on dismissal.
- Expire records after 30 minutes and continue safely if browser storage is unavailable.

## Verification

- Real-browser coverage verifies workflow success followed by a stale refreshed page and confirms that no duplicate upgrade action is shown.
- Real-browser coverage seeds the target build's same-tab record and confirms the success message plus dismissal cleanup.
- Unit coverage verifies normalization, expiration, bounded-refresh state, and cleanup.
