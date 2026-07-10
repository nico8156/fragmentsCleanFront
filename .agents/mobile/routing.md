# Mobile Agent Routing - Fragments

Before implementing, classify the mobile task.

## Optimistic Command

Use `orchestrators/optimistic-command.md` for offline-first writes.

Examples:
- like/unlike
- comment create/update/delete
- ticket submission

## Read Feature

Use `orchestrators/read-feature.md` for data retrieval and display state.

Examples:
- coffee detail
- comments list
- article detail
- ticket history

## Socket ACK

Use `orchestrators/socket-ack.md` for backend ACK messages.

Examples:
- like ACK
- comment ACK
- ticket verification completed ACK

## Bootstrap

Use `orchestrators/bootstrap.md` for app startup, auth, connectivity, outbox rehydration, and runtime lifecycle.

## Studio/Admin Feature

Use the normal Screen -> ViewModel -> Redux/use case -> Gateway -> backend
direction for Fragments Studio surfaces.

Examples:
- cafe management backed by `/api/admin/coffees`
- article editing backed by `/api/admin/studio/articles`
- article image upload backed by multipart admin gateway

Studio writes are admin/operator workflows, but they still must expose command
ids when they create domain state so the UI can observe `/commands/{commandId}`.
Do not put admin tokens in Expo config.

## If Unsure

Do not add UI or network calls first.

Identify:
- screen/view model involved
- client context owner
- gateway port needed
- whether write must use outbox
- whether command status fallback is required
