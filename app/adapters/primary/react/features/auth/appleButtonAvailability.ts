/** Expo SDK 54 exposes view configuration through JSI; legacy metadata is a fallback. */
export function hasAppleButtonView(input: {
	getViewConfig?: (name: string) => unknown;
	legacyView?: unknown;
}): boolean {
	try {
		return input.getViewConfig
			? Boolean(input.getViewConfig("ExpoAppleAuthentication"))
			: Boolean(input.legacyView);
	} catch { return false; }
}
