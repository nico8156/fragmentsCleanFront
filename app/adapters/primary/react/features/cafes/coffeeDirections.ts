import { Linking, Platform } from "react-native";

type CoffeeDirectionsInput = {
	latitude?: number;
	longitude?: number;
	label?: string;
	addressLine?: string;
};

/** Opens the platform map app when possible, with a web-map fallback. */
export async function openCoffeeDirections({ latitude, longitude, label = "Café", addressLine }: CoffeeDirectionsInput): Promise<boolean> {
	const encodedLabel = encodeURIComponent(label);
	const hasCoordinates = latitude != null && longitude != null;
	const fallback = hasCoordinates
		? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
		: addressLine ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}` : undefined;
	if (!fallback) return false;

	const primary = !hasCoordinates ? fallback : Platform.OS === "ios"
		? `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`
		: Platform.OS === "android" ? `geo:0,0?q=${latitude},${longitude}(${encodedLabel})` : fallback;

	try {
		await Linking.openURL((await Linking.canOpenURL(primary)) ? primary : fallback);
		return true;
	} catch {
		return false;
	}
}
