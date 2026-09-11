# Account isolation

Implemented in the first common release tranche, 2026-09-11.

## Runtime boundary

`initReduxStoreWl` increments `accountScope.generation` whenever the authenticated
user id changes, including logout. It resets tickets, entitlements, comments,
likes, saved coffees, outbox, projection-sync state, location and the old profile.
Public coffee/article data may remain. Navigation is remounted by generation.
An A -> B -> A sequence invalidates work started by the first A as well.

`accountScopedThunks` and the account-aware listener factory discard dispatches
from an obsolete generation. Auth deliberately uses a separate attempt counter:
its effects themselves establish/change the session. Secure-store writes are
serialized; late login/load/refresh/profile results cannot restore a logged-out
identity. The token bridge is updated without an async gap before Redux identity.

Dispatch protection does not cancel external side effects. Outbox send and status
polling also check the generation after awaits and before further work. In-flight
locks are generation-specific, so a stuck request from A cannot prevent B's work.
The location subscription is removed on identity changes. SSE checks generations
in callbacks, and the HTTP stream adapter ignores old responses/chunks.

New listeners handling account-dependent async work must import
`createListenerMiddleware` from `appWl/runtime/accountScope`, not directly from
Redux Toolkit. New side effects after an `await` need an explicit generation
check as well; guarded dispatch alone cannot protect an HTTP call.

## Durable data

Production wiring enables `accountStorageManaged` and installs
`accountStorageMiddleware` in place of the global cache/outbox persistence pair.
It passes the user id explicitly to storage, captures immutable snapshots before
saving, serializes writes per account, and restores only that account's namespace:

- `app.outbox.account.<encoded user id>`
- `app.read-model-cache.account.<encoded user id>`
- `app.sync.meta.account.<encoded user id>`

Each MMKV instance retains its `state` key. These are local product UUIDs, not
access tokens. No database migration or mobile permission change is required.
Snapshot and cursor ownership is established by the namespace, not inferred
from command payloads, which do not consistently carry a user id.

Logout clears visible Redux state but does not delete the account's offline
commands. Returning to that account (including after store recreation) restores
them. `processing` commands are requeued by the existing sanitizer. Stale restore
results cannot populate another account. Production boot waits for auth and this
hydration and never invokes global snapshot restoration.

Until restoration completes, signed-in screens and UI intents are gated. A
storage error presents retry/logout instead of exposing an empty working outbox
and overwriting unreadable commands. Failed writes retain a session-memory copy
for retry; this cannot guarantee recovery after an OS/process kill while the
underlying storage is failing. Native MMKV behavior still needs device testing.

## Existing installations: explicit recovery decision

The previous global MMKV instances remain untouched. They may contain several
accounts' data and have no trustworthy owner. They are therefore **not adopted,
sent, cleared or deleted automatically**. Previously cached tickets may disappear
from the new UI even though the old snapshot remains on disk.

Before external distribution, decide a supervised recovery/migration for these
installations. Do not assign the whole legacy outbox to the first user who logs
in. Do not use the development clear-outbox helper to hide this issue. A rollback
to the old mobile runtime would restore its global-data exposure; it is not a
safe production rollback. Preserve both old and new namespaces and fix forward.

## Verification

Tests cover A -> B -> A, account/store recreation, queued-command retention,
unreadable storage and retry, old thunk/listener/auth responses, pending sends,
account-scoped native adapter keys (with an MMKV boundary fake), old SSE chunks
and per-account cursor restoration. Run:

```sh
npx jest --runInBand --watchman=false
npx tsc --noEmit
npm run redux:map:check
```

Device recipe: on A create a pending command offline; log out, sign in as B and
check tickets/favorites/profile/Pass are B's only; reconnect; return to A and
verify its command reconciles once via canonical command status. Repeat after
killing/reopening the app, with delayed HTTP and with location denied. The
permission reducer now preserves `denied`/`undetermined` instead of treating
non-empty strings as granted.

This tranche does not repair the separate HTTP technical/business-error mapping,
durable `REJECTED` recording, or command-status owner scoping from the audit.
Those remain release blockers and must not be inferred as solved by these tests.
