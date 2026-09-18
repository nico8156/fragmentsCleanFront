import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

type SentryEvent = Parameters<NonNullable<Parameters<typeof Sentry.init>[0]["beforeSend"]>>[0];

let initialized = false;

export function sanitizeCrashEvent(event: SentryEvent): SentryEvent {
	return {
		...event,
		user: undefined,
		request: undefined,
		breadcrumbs: undefined,
		extra: undefined,
	};
}

export function initializeCrashReporting() {
	if (initialized) return;
	initialized = true;

	const dsn = Constants.expoConfig?.extra?.sentryDsn;
	Sentry.init({
		dsn: typeof dsn === "string" ? dsn : undefined,
		enabled: !__DEV__ && typeof dsn === "string" && dsn.length > 0,
		sendDefaultPii: false,
		attachStacktrace: true,
		tracesSampleRate: 0,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0,
		beforeSend: sanitizeCrashEvent,
	});
}

export const withCrashReporting = Sentry.wrap;
