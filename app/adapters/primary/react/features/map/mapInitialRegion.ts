type UserCoords = { lat: number; lng: number };
type CoffeeCoords = { lat: number; lon: number };

export function resolveInitialMapCenter({
	userCoords,
	firstCoffee,
	fallback,
}: {
	userCoords?: UserCoords;
	firstCoffee?: CoffeeCoords;
	fallback: UserCoords;
}): UserCoords {
	if (userCoords) return userCoords;
	if (firstCoffee) return { lat: firstCoffee.lat, lng: firstCoffee.lon };
	return fallback;
}
