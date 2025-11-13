# Opening Hours Context (WL)

Expose les créneaux d'ouverture structurés par café pour nourrir les view models "open now".

- `typeAction/openingHours.type.ts` décrit les `DayWindow` (jour + plage en minutes) ainsi que le `HoursByDayVM` consommé par les selectors.【F:app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type.ts†L1-L18】
- `openingHours.reducer.ts` fusionne deux flux : `openingHoursHydrated` (chaînes brutes pour historique) et `hoursHydrated` (fenêtres parsées via `parseWeekdayDescription`). Les données sont regroupées par café et indexées dans `statusByCoffeeId`.【F:app/core-logic/contextWL/openingHoursWl/reducer/openinghours.reducer.ts†L1-L33】
- `onOpeningHourRetrieval` appelle `gateways.openingHours.getAllOpeningHours()` puis hydrate l'état, avec un fallback vide si le gateway est absent ou en erreur.【F:app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval.ts†L1-L23】
- Les selectors (`selectOpeningHoursForCoffeeIdDayWindow`, `selectHoursByDayVM`) utilisent Reselect pour produire des `HoursByDayVM` mémorisés exploités par `useCafeOpenNow`.【F:app/core-logic/contextWL/openingHoursWl/selector/openingHours.selector.ts†L1-L34】

`openingHoursFlow.mmd` illustre la chaîne complète.
