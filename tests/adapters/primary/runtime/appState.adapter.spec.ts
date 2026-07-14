import { resolveAppLifecycleTransition } from "@/app/adapters/primary/runtime/appState.adapter";

describe("resolveAppLifecycleTransition", () => {
	it("detects explicit foreground return from background to active", () => {
		expect(resolveAppLifecycleTransition("background", "active")).toBe("foreground");
	});

	it("detects explicit foreground return from iOS inactive to active", () => {
		expect(resolveAppLifecycleTransition("inactive", "active")).toBe("foreground");
	});

	it("keeps first active transition distinct from foreground resume", () => {
		expect(resolveAppLifecycleTransition(null, "active")).toBe("active");
	});

	it("detects inactive and background suspension transitions", () => {
		expect(resolveAppLifecycleTransition("active", "inactive")).toBe("inactive");
		expect(resolveAppLifecycleTransition("inactive", "background")).toBe("background");
	});

	it("ignores duplicate native states", () => {
		expect(resolveAppLifecycleTransition("background", "background")).toBe("unchanged");
	});
});
