// app/adapters/primary/wiring/config.ts
import Constants from "expo-constants";

export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
if (!API_BASE_URL) throw new Error("[CONFIG] Missing expo.extra.apiBaseUrl");

export const WS_URL = `${API_BASE_URL.replace(/^http/, "ws")}/ws`;

