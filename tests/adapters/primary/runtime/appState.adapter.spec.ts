import {
	mountAppStateAdapterWithRuntime,
	resolveAppLifecycleTransition,
} from "@/app/adapters/primary/runtime/appState.adapter";
import {
	appBecameBackground,
	appBecameForeground,
	appBecameInactive,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";

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

describe("mountAppStateAdapterWithRuntime", () => {
	it("recovers a missed active event by polling AppState.currentState after sleep", () => {
		const dispatch = jest.fn();
		let intervalCallback: (() => void) | undefined;
		let changeHandler: ((status: any) => void) | undefined;

		const appState = {
			currentState: "active" as any,
			addEventListener: jest.fn((_event: string, handler: (status: any) => void) => {
				changeHandler = handler;
				return { remove: jest.fn() };
			}),
		};
		const timer = {
			setInterval: jest.fn((callback: () => void) => {
				intervalCallback = callback;
				return 1 as any;
			}),
			clearInterval: jest.fn(),
		};

		const unmount = mountAppStateAdapterWithRuntime(
			{ dispatch } as any,
			appState as any,
			timer as any,
			{ currentStatePollMs: 1_000 },
		);

		changeHandler?.("inactive");
		changeHandler?.("background");
		appState.currentState = "active";
		intervalCallback?.();

		expect(dispatch).toHaveBeenCalledWith(appBecameInactive());
		expect(dispatch).toHaveBeenCalledWith(appBecameBackground());
		expect(dispatch).toHaveBeenCalledWith(appBecameForeground());

		unmount();
		expect(timer.clearInterval).toHaveBeenCalledWith(1);
	});
});
