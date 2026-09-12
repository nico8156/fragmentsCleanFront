export function indexCoffeeMarkers<T extends { id: unknown }>(coffees: readonly T[]): ReadonlyMap<string, T> {
	return new Map(coffees.map((coffee) => [String(coffee.id), coffee]));
}
