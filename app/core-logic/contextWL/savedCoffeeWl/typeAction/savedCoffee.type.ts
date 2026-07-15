import type { ISODate } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";

export type SavedCoffeeItem = {
	coffeeId: string;
	name: string;
	addressLine?: string | null;
	city?: string | null;
	postalCode?: string | null;
	country?: string | null;
	savedAt: ISODate | string;
	version: number;
	optimistic?: boolean;
	pendingCommandId?: string;
};

export const savedCoffeeLoadingStates = {
	IDLE: "idle",
	PENDING: "pending",
	ERROR: "error",
	SUCCESS: "success",
} as const;

export type SavedCoffeeLoadingState =
	typeof savedCoffeeLoadingStates[keyof typeof savedCoffeeLoadingStates];

export type SavedCoffeeStateWl = {
	byCoffeeId: Record<string, SavedCoffeeItem>;
	ids: string[];
	version: number;
	loading: SavedCoffeeLoadingState;
	error?: string;
	lastFetchedAtMs?: number;
};
