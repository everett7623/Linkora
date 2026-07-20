# Case: Successful GitHub Actions Upgrade Has No Production Deployment Record

Date: 2026-07-20

## Symptom

The Linketry online-upgrade workflow succeeds and the live Worker/Admin version changes, but the repository shows no GitHub production environment or production deployment history.

## Evidence Order

1. Check the live `/health` version and compiled Admin version marker.
2. Inspect the exact workflow run, conclusion, commit, and deploy-step timestamps.
3. List repository environments and deployments through the GitHub API.
4. Inspect the workflow job-level `environment` declaration.

## Root Cause

Cloudflare deployment success and GitHub deployment-environment tracking are separate systems. The production workflow deployed successfully but its `deploy` job did not declare `environment: production`, so GitHub had no production environment target to record.

## Fix

- Add `environment: production` to the production deploy job.
- Keep repository variables/secrets and all safety gates unchanged.
- Add a contract test that fails if the binding is removed.
- Document explicit environment creation and post-deploy verification.

## Verification

- Run the deployment contract suite locally.
- Confirm the repository environment list contains `production`.
- After the next approved workflow run, confirm the deployment history identifies `production` and the live `/health` version matches the release.
