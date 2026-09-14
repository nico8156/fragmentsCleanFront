import { hasAppleButtonView } from "@/app/adapters/primary/react/features/auth/appleButtonAvailability";

describe("Apple native button registration", () => {
	it("accepts a JSI-registered view even without legacy metadata", () => {
		expect(hasAppleButtonView({ getViewConfig: name => name === "ExpoAppleAuthentication" ? { validAttributes: {} } : null })).toBe(true);
	});
	it("does not mount a missing native view even with stale legacy metadata", () => {
		expect(hasAppleButtonView({ getViewConfig: () => null, legacyView: {} })).toBe(false);
	});
	it("supports legacy registration when no JSI view API exists", () => {
		expect(hasAppleButtonView({ legacyView: {} })).toBe(true);
		expect(hasAppleButtonView({})).toBe(false);
	});
});
