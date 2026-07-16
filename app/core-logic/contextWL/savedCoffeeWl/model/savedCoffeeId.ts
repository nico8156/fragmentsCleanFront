import { v5 as uuidv5 } from "uuid";

const SAVED_COFFEE_NAMESPACE = "ca7a5ca3-5134-4fe0-9b2c-32702d15d041";

export const computeSavedCoffeeId = (userId: string, coffeeId: string): string =>
	uuidv5(`${userId}:${coffeeId}`, SAVED_COFFEE_NAMESPACE);
