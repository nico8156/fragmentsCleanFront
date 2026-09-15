# Article reading flow

Status: article curation client connected locally on 2026-09-15; staging release
still requires migration and backend/Studio/mobile deployment together.

Mobile is a read client for editorial content. It does not generate, edit or
publish articles. The backend projection is the source of truth; Redux and the
durable read cache make that truth usable offline.

## Public contract

A published article contains identity, slug, locale, title, introduction,
ordered heading/paragraph/image blocks, conclusion, cover, tags, author,
reading time, ISO-8601 dates, version, status, nullable featured rank and optional
coffee references.
The transport mapper validates this response instead of casting it. Runtime
wiring uses `HttpArticleWlGateway`; fake gateways are test-only.

## Read path

```text
bootstrap, foreground warmup or screen refresh
-> articlesListRetrieval({ locale: "fr-FR" })
-> ArticleWlGateway.list
-> public articles GET
-> strict ArticleTransportMapper
-> articleListReceived
-> normalized Redux state + durable read cache
-> selectors -> view model -> screen
```

Opening an article uses `getBySlug`. The screen renders cover, metadata, title,
introduction, illustrated blocks, conclusion and tags in backend order. Remote
images use the native/disk image cache.

The Home hero uses Studio's featured ranks (with a one-article most-recent
fallback before the first curation). "À lire ensuite" uses the three most recent
non-featured articles not shown in that hero. "Tous les articles" is an
independent catalogue route over the complete published snapshot and opens the
same article detail. Draft/archived articles are absent from the public API.

## Offline and freshness

The article cache is rehydrated before warmup. Network or refresh failure keeps
the last valid model readable; it must not erase the cache.

Publication/archive emits a `projection.updated` SSE hint with
`projection = articles`. `projectionSyncListenerFactory` responds by dispatching
`articlesListRetrieval`; only the resulting authoritative GET updates Redux.
SSE contains no article content and never mutates the reducer directly. Missed
SSE remains safe because bootstrap, foreground warmup and manual refresh query
the backend.

## Bounded FlowAtlas check (2026-09-15)

The TypeScript MCP scan found `articleListReceived` at its action definition and
returned a complete two-edge context:
`articlesListRetrieval -> articleListReceived -> articleWlReducer`. The bounded
context of `articlesListRetrieval` also found its requested/failed actions and
`ArticleWlGateway` as an external port. This confirms the Redux read path
without opening the whole repository. The new composition helper
`refreshHomeReadModels` was not found as a `Handler`; FlowAtlas currently proves
the action/reducer slice more reliably than a screen/view-model orchestration
chain. The available Java integration-event fixture is scoped to tickets, not
articles, so it was not repurposed into a generic Java scan for this feature.

## Next mobile iteration

Review presentation without weakening this contract:

- typography and spacing for long French paragraphs;
- back-button and safe-area behavior while scrolling;
- image aspect ratios, placeholders and loading transitions;
- list empty/error/stale-cache states;
- tag/metadata hierarchy, accessibility and dynamic text sizing.

Any backend contract change must be separately agreed and versioned.
