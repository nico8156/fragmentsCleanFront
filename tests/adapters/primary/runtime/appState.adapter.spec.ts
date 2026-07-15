import {
	mountAppStateAdapterWithRuntime,
	resolveAppLifecycleTransition,
} from "@/app/adapters/primary/runtime/appState.adapter";
import {
	appBecameBackground,
	appBecameForeground,
	appBecameInactive,
} from "@/app/core-logic/contextWL/appWl/typeAction/appWl.action";
import { Platform } from "react-native";

const setPlatformOS = (os: "ios" | "android") => {
	Object.defineProperty(Platform, "OS", {
		configurable: true,
		value: os,
	});
};

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
	beforeEach(() => {
		setPlatformOS("ios");
	});

	it("recovers a missed active event by polling AppState.currentState after sleep", () => {
		const dispatch = jest.fn();
		let intervalCallback: (() => void) | undefined;
		let changeHandler: ((status: any) => void) | undefined;

		const appState = {
			currentState: "active" as any,
			addEventListener: jest.fn((event: string, handler: (status: any) => void) => {
				if (event === "change") changeHandler = handler;
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

	it("does not subscribe to Android-only focus events on iOS", () => {
		const dispatch = jest.fn();

		const appState = {
			currentState: "active" as any,
			addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		};
		const timer = {
			setInterval: jest.fn(() => 1 as any),
			clearInterval: jest.fn(),
		};

		mountAppStateAdapterWithRuntime(
			{ dispatch } as any,
			appState as any,
			timer as any,
			{ currentStatePollMs: 1_000 },
		);

		expect(appState.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
		expect(appState.addEventListener).not.toHaveBeenCalledWith("focus", expect.any(Function));
	});

	it("recovers resume from an Android native focus event when change active is missed", () => {
		setPlatformOS("android");
		const dispatch = jest.fn();
		let changeHandler: ((status: any) => void) | undefined;
		let focusHandler: (() => void) | undefined;

		const appState = {
			currentState: "active" as any,
			addEventListener: jest.fn((event: string, handler: any) => {
				if (event === "change") changeHandler = handler;
				if (event === "focus") focusHandler = handler;
				return { remove: jest.fn() };
			}),
		};
		const timer = {
			setInterval: jest.fn(() => 1 as any),
			clearInterval: jest.fn(),
		};

		mountAppStateAdapterWithRuntime(
			{ dispatch } as any,
			appState as any,
			timer as any,
			{ currentStatePollMs: 1_000 },
		);

		changeHandler?.("inactive");
		changeHandler?.("background");
		appState.currentState = "active";
		focusHandler?.();

		expect(dispatch).toHaveBeenCalledWith(appBecameForeground());
		expect(dispatch.mock.calls.filter(([action]) => action.type === appBecameForeground.type)).toHaveLength(1);
	});

	it("does not duplicate foreground recovery after a normal active change", () => {
		setPlatformOS("android");
		const dispatch = jest.fn();
		let changeHandler: ((status: any) => void) | undefined;
		let focusHandler: (() => void) | undefined;

		const appState = {
			currentState: "active" as any,
			addEventListener: jest.fn((event: string, handler: any) => {
				if (event === "change") changeHandler = handler;
				if (event === "focus") focusHandler = handler;
				return { remove: jest.fn() };
			}),
		};
		const timer = {
			setInterval: jest.fn(() => 1 as any),
			clearInterval: jest.fn(),
		};

		mountAppStateAdapterWithRuntime(
			{ dispatch } as any,
			appState as any,
			timer as any,
			{ currentStatePollMs: 1_000 },
		);

		changeHandler?.("inactive");
		changeHandler?.("background");
		changeHandler?.("active");
		focusHandler?.();

		expect(dispatch.mock.calls.filter(([action]) => action.type === appBecameForeground.type)).toHaveLength(1);
	});
});
