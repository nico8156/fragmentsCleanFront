import { refreshHomeReadModels } from "@/app/core-logic/contextWL/appWl/usecases/refreshHomeReadModels";

describe("refreshHomeReadModels", () => {
	it("retrieves authoritative public snapshots without needing an SSE event", async () => {
		const calls: string[] = [];
		const gateways: any = {
			coffees: { getAllSummaries: async () => { calls.push("coffees"); return { kind: "updated", items: [], etag: "new" }; } },
			cfPhotos: { getAllphotos: async () => { calls.push("photos"); return { data: [] }; } },
			openingHours: { getAllOpeningHours: async () => { calls.push("hours"); return { data: [] }; } },
			articles: { list: async () => { calls.push("articles"); return { items: [] }; } },
		};
		const state: any = { cfState: { requests: { list: { etag: undefined } } } };
		const dispatch: any = (action: any): any => typeof action === "function" ? action(dispatch, () => state, gateways) : action;
		await refreshHomeReadModels(dispatch);
		expect(calls.sort()).toEqual(["articles", "coffees", "hours", "photos"]);
	});
	it("refreshes private Home sections only when a signed-in user is supplied", async () => {
		const calls: string[] = [];
		const gateways: any = {
			coffees: { getAllSummaries: async () => ({ kind: "updated", items: [] }) },
			cfPhotos: { getAllphotos: async () => ({ data: [] }) },
			openingHours: { getAllOpeningHours: async () => ({ data: [] }) },
			articles: { list: async () => ({ items: [] }) },
			experiences: { listMine: async () => { calls.push("experiences"); return { items: [] }; } },
			entitlements: { get: async () => { calls.push("pass"); return { data: { userId: "user-1", confirmedTickets: 0, updatedAt: "2026-09-15T10:00:00Z" } }; } },
		};
		const state: any = { cfState: { requests: { list: { etag: undefined } } } };
		const dispatch: any = (action: any): any => typeof action === "function" ? action(dispatch, () => state, gateways) : action;
		await refreshHomeReadModels(dispatch, "user-1");
		expect(calls.sort()).toEqual(["experiences", "pass"]);
	});
});
