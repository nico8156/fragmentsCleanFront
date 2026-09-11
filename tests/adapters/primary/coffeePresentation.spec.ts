import { filterPublicCoffeeTags } from "@/app/adapters/primary/react/features/cafes/coffeePresentation";

describe("coffee public presentation", () => {
	it("keeps editorial characteristics and removes technical source tags", () => {
		expect(filterPublicCoffeeTags(["espresso", "google-places", "source:import", "Google:verified", "roaster"])).toEqual(["espresso", "roaster"]);
	});
});
