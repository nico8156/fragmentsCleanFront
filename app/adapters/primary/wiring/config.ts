// config.ts
import Constants from "expo-constants";

const api = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
if (!api) throw new Error("[CONFIG] Missing expo.extra.apiBaseUrl");

export const API_BASE_URL: string = api;
export const WS_URL: string = `${api.replace(/^http/, "ws")}/ws`;
