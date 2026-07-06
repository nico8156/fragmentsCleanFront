// config.ts
import Constants from "expo-constants";

const api = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
if (!api) throw new Error("[CONFIG] Missing expo.extra.apiBaseUrl");

export const API_BASE_URL: string = api;
export const PROJECTION_SYNC_EVENTS_PATH: string =
	(Constants.expoConfig?.extra?.projectionSyncEventsPath as string | undefined)
		?.trim()
		|| "/api/sync/events";
export const GOOGLE_MOBILE_IOS_CLIENT_ID: string | undefined =
	(Constants.expoConfig?.extra?.googleMobileIosClientId as string | undefined)
		?.trim()
		|| undefined;
export const GOOGLE_MOBILE_IOS_REDIRECT_URI: string =
	(Constants.expoConfig?.extra?.googleMobileIosRedirectUri as string | undefined)
		?.trim()
		|| "fragmentscleanfront://auth/google";
export const GOOGLE_WEB_CLIENT_ID: string | undefined =
	(Constants.expoConfig?.extra?.googleWebClientId as string | undefined)
		?.trim()
		|| undefined;
