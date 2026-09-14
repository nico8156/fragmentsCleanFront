import { FLOATING_TAB_BAR_CLEARANCE, floatingTabGlassPresentation, floatingTabPresentation } from "@/app/adapters/primary/react/navigation/floatingTabBar";

describe("floating tab bar presentation", () => {
	it("keeps the four product destinations explicit and accessible", () => {
		expect(floatingTabPresentation).toEqual({
			Home: { label: "Accueil", icon: "home" },
			Map: { label: "Carte", icon: "map" },
			Rewards: { label: "Pass", icon: "gift" },
			Profile: { label: "Profil", icon: "person" },
		});
	});

	it("reserves enough content clearance for the floating control", () => {
		expect(FLOATING_TAB_BAR_CLEARANCE).toBeGreaterThanOrEqual(100);
	});

	it("keeps a visible liquid-glass separation from the content", () => {
		expect(floatingTabGlassPresentation.blurIntensity).toBeGreaterThanOrEqual(60);
		expect(floatingTabGlassPresentation.surfaceColor).toBe("rgba(21,16,14,0.32)");
		expect(floatingTabGlassPresentation.borderColor).toBe("rgba(244,237,230,0.28)");
	});
});
