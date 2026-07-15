import type { SavedCoffeeItem } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

export type SavedCoffeeSnapshot = {
	items: SavedCoffeeItem[];
	version: number;
	serverTime?: string;
};

export interface SavedCoffeeGateway {
	get(input: { signal: AbortSignal }): Promise<SavedCoffeeSnapshot>;
	set(input: {
		commandId: string;
		savedCoffeeId: string;
		coffeeId: string;
		value: boolean;
		at: string;
	}): Promise<void>;
}
