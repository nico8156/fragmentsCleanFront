# Private photos and profile projection

The mobile owns image selection and resilient transfer UX; the backend remains
the source of truth for media validation, ownership, normalization and public
read URLs.

## Durable write flow

```text
screen
-> pickDurableImage technical adapter
-> JPEG normalization and bounded resize
-> app-owned document file
-> Redux intent
-> optimistic user/experience reducer
-> account-partitioned local outbox
-> upload intent + signed object PUT + confirmation
-> /commands/{commandId} reconciliation
-> authoritative profile or experience retrieval
```

The picker requests camera permission only when the camera is selected. The
system photo picker does not request broad library access, following Expo SDK
54 guidance. It accepts the native iOS representation (including HEIC), renders
it as JPEG, bounds its longest edge to 1600 pixels and enforces the backend's
decimal 8,000,000-byte limit.

Reference: [Expo SDK 54 ImagePicker](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/).
The normalized copy is stored under the application's document directory before
the Redux intent is emitted. A cache URI must never be persisted in the outbox.

Client normalization is a compatibility and bandwidth step, not a security
boundary. The backend independently inspects, decodes, strips metadata,
normalizes and authorizes every private object. Technical failure keeps the
outbox command retryable; only an explicit business rejection may roll back the
optimistic state.

## Public profile freshness

`userApplicationContext` owns display name and avatar. Its
`app.user.profile_updated` integration event feeds the Social and Experience
projections; the mobile does not rewrite those read stores after a profile
mutation.

For immediate local consistency only, presentation view models overlay the
currently authenticated profile on that user's already-loaded comments and
experiences. Other users and subsequent devices observe the authoritative
event-fed projections on their next normal retrieval. A profile-specific
Projection Sync invalidation is not emitted yet; an already-open second device
therefore needs a refresh or another relevant projection invalidation.
