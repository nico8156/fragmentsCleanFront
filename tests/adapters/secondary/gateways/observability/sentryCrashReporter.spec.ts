jest.mock("@sentry/react-native", () => ({ init: jest.fn(), wrap: (component: unknown) => component }));
jest.mock("expo-constants", () => ({ expoConfig: { extra: {} } }));

import { sanitizeCrashEvent } from "@/app/adapters/secondary/gateways/observability/sentryCrashReporter";

describe("Sentry crash reporting", () => {
	it("removes identity, credentials and request bodies before transmission", () => {
		const sanitized = sanitizeCrashEvent({
			type: undefined,
			event_id: "event-1",
			user: { id: "user-1", email: "person@example.test" },
			request: {
				cookies: { session: "secret" },
				data: { message: "private" },
				headers: {
					Authorization: "Bearer secret",
					Cookie: "session=secret",
					"Content-Type": "application/json",
				},
			},
			breadcrumbs: [{ category: "http", message: "https://example.test/path?token=secret" }],
			extra: { payload: "private" },
		});

		expect(sanitized.user).toBeUndefined();
		expect(sanitized.request).toBeUndefined();
		expect(sanitized.breadcrumbs).toBeUndefined();
		expect(sanitized.extra).toBeUndefined();
	});
});
