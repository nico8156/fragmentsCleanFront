import { createAction } from "@reduxjs/toolkit";

import type { AppStateWl } from "@/app/store/appStateWl";

export const READ_MODEL_CACHE_SCHEMA_VERSION = 1;

export type DurableReadModelCacheSnapshot = {
	schemaVersion: typeof READ_MODEL_CACHE_SCHEMA_VERSION;
	updatedAt: string;
	coffees?: AppStateWl["coffees"];
	cfPhotos?: AppStateWl["cfPhotos"];
	openingHours?: AppStateWl["openingHours"];
};

export const readModelCacheRehydrated = createAction<DurableReadModelCacheSnapshot>(
	"READ_MODEL_CACHE/REHYDRATED",
);
