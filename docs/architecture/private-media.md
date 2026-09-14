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

The adapter first probes `ExpoImageManipulator` through Expo's optional-native-
module API, then loads `expo-image-manipulator` only when an image is selected
and the native implementation exists. This prevents a JavaScript reload from
crashing an older native development/TestFlight binary that does not contain
the newly added module. Such a binary may still persist a JPEG/PNG already
returned in a compatible representation; a raw HEIC instead produces an
explicit rebuild message. Full normalization is guaranteed only in the rebuilt
binary.
The normalized copy is stored under the application's document directory before
the Redux intent is emitted. A cache URI must never be persisted in the outbox.

Signed object uploads use `expo/fetch`, not React Native's global `fetch`.
Expo SDK 54's `File` is a supported binary request body on that transport. The
global transport was observed creating zero-byte S3 objects on a real iPhone and
must not be reintroduced for private file PUTs.

Reference: [Expo SDK 54 FileSystem — uploading files using expo/fetch](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/#uploading-files-using-expofetch).

The gateway does not delete the durable local file when the confirmation HTTP
request merely returns successfully. The file remains the optimistic read model
while `/commands/{commandId}` and the backend projection reconcile. It is
discarded through the injected local-media technical port only after a user or
experience read model contains the remote replacement, or after an explicit
terminal rejection. This keeps transport success distinct from business state.

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
