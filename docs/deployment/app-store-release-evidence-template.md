# Fragments App Store release evidence

Copy this file for each release candidate. Never put passwords, bearer tokens,
OAuth codes, Sentry auth tokens or personal user data in the completed receipt.

## Immutable candidate

| Item | Value |
| --- | --- |
| Date / operator | |
| Mobile commit (40 characters) | |
| Backend commit / deployed image digest | |
| Studio commit / deployed bundle release | |
| Migration manifest and status | |
| EAS build id | |
| App version / build number | |
| IPA SHA-256 (`native:ipa:inspect`) | |
| TestFlight processing status | |

## Automated evidence

- [ ] Mobile `npm run verify:ci` is green.
- [ ] Backend release gate is green for the deployed commit.
- [ ] Studio gate is green for the deployed bundle.
- [ ] Full-history Gitleaks gates are green in all three repositories.
- [ ] `native:ipa:inspect` is green for the exact EAS artifact.
- [ ] IPA contains the Apple Sign-In entitlement and aggregated privacy manifest.
- [ ] EAS build log proves Sentry source-map and dSYM upload.
- [ ] Sentry receives a TestFlight diagnostic resolved to original source.
- [ ] Published privacy policy and App Privacy answers include diagnostic data.

## Device matrix

Record device, iOS version, result and evidence reference for every row.

| Journey | Small/current iPhone | Large/current iPhone | Previous supported iOS |
| --- | --- | --- | --- |
| Google sign-in / logout / reconnect | | | |
| Apple sign-in / logout / reconnect | | | |
| Account deletion and remote provider revocation | | | |
| Home, editorial carousel and pull-to-refresh | | | |
| Location denied / approximate / granted | | | |
| Map, bottom sheet, details and return | | | |
| Offline write, restart, reconnect and command reconciliation | | | |
| Ticket valid / invalid / duplicate / technical failure | | | |
| Experience text/photo upload, retry and deletion | | | |
| Avatar replacement and propagation | | | |
| Report, block, unblock and moderation follow-up | | | |
| VoiceOver, large text, keyboard and reduced motion/transparency | | | |
| Legal links and support | | | |

## Release decision

- Decision: `GO` / `NO-GO`
- Accepted residual risks:
- Blocking anomalies:
- Rollback target:
- Approver and date:
