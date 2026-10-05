# Floating navigation and coffee discovery

Lot 07 keeps React Navigation and the four existing product destinations. The
custom tab bar is a primary adapter only: it owns visual presentation, haptics,
safe-area placement and accessibility labels; it does not own navigation state
or product state.

`FragmentsTabBar` uses the React Navigation tab state and emits the standard
`tabPress`/`tabLongPress` events before navigating. It hides while the keyboard
is visible and switches from blur to an opaque surface when Reduce Transparency
is enabled. Tab routes use `ScrollClearance` to provide bottom content padding
through a render callback: the scroll viewport extends behind the translucent
bar, with no fixed full-width opaque band. At maximum scroll, the last control
clears the bar height, safe-area inset, bottom gap and a readable margin.
Home, the coffee list, Pass and the shared profile layout use this same calculation.
Root-stack routes (including cafe details and the article catalogue) retain
safe-area-only clearance because they are outside the tab navigator.
The preview sheet uses the same bottom content padding without an opaque footer.
Legacy screens retain `FLOATING_TAB_BAR_CLEARANCE`. The map remains underneath
the bar while its location control clears it.

The TestFlight refinement keeps the same dimensions and destinations, while
raising blur, adding a thin light rim and a restrained accent shadow. This
reuses the translucent separation perceived on native profile back controls;
it is a presentation-only change and preserves the opaque accessibility
fallback.

The coffee selection flow remains:

```text
marker -> selected coffee id -> existing coffee read model -> compact sheet
       -> "Voir la fiche" or "Itinéraire"
```

The sheet never maps backend data in JSX. It receives the existing view-model
data, presents a loading state while that snapshot is absent, and makes no
write. The map preserves its component state behind the pushed coffee detail,
so returning restores the region and selection context.

Directions are a small native boundary shared by map and detail actions. It
prefers Apple Plans on iOS, Android geo intents on Android, and a web map
fallback if the platform handler is unavailable. A failed hand-off remains a
local UX failure and does not alter any server or Redux state.

Coffee tags are filtered only for public presentation: technical import/source
labels never appear in the detail screen. This does not mutate the source read
model.
