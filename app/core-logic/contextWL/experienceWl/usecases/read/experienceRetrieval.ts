import type { AppThunkWl } from "@/app/store/reduxStoreWl";
import { coffeeExperiencesFailed, coffeeExperiencesPending, coffeeExperiencesReceived, myExperiencesFailed, myExperiencesPending, myExperiencesReceived } from "../../typeAction/experience.action";

const inFlight = new Map<string, AbortController>();
const replace = (key: string) => { inFlight.get(key)?.abort(); const controller = new AbortController(); inFlight.set(key, controller); return controller; };

export const coffeeExperiencesRetrieval = (input: { coffeeId: string; cursor?: string; limit?: number }): AppThunkWl<Promise<void>> => async (dispatch, _state, gateways) => {
	if (!gateways?.experiences) { dispatch(coffeeExperiencesFailed({ coffeeId: input.coffeeId, error: "experience gateway not configured" })); return; }
	const key = `coffee:${input.coffeeId}`; const controller = replace(key); dispatch(coffeeExperiencesPending({ coffeeId: input.coffeeId }));
	try { const page = await gateways.experiences.listCoffee({ ...input, signal: controller.signal }); if (inFlight.get(key) === controller) dispatch(coffeeExperiencesReceived({ coffeeId: input.coffeeId, page })); }
	catch (error: any) { if (error?.name !== "AbortError") dispatch(coffeeExperiencesFailed({ coffeeId: input.coffeeId, error: String(error?.message ?? error) })); }
	finally { if (inFlight.get(key) === controller) inFlight.delete(key); }
};

export const myExperiencesRetrieval = (input: { cursor?: string; limit?: number } = {}): AppThunkWl<Promise<void>> => async (dispatch, _state, gateways) => {
	if (!gateways?.experiences) { dispatch(myExperiencesFailed({ error: "experience gateway not configured" })); return; }
	const key = "mine"; const controller = replace(key); dispatch(myExperiencesPending());
	try { const page = await gateways.experiences.listMine({ ...input, signal: controller.signal }); if (inFlight.get(key) === controller) dispatch(myExperiencesReceived(page)); }
	catch (error: any) { if (error?.name !== "AbortError") dispatch(myExperiencesFailed({ error: String(error?.message ?? error) })); }
	finally { if (inFlight.get(key) === controller) inFlight.delete(key); }
};
