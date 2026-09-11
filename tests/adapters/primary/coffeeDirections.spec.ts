import { openCoffeeDirections } from "@/app/adapters/primary/react/features/cafes/coffeeDirections";
import { Linking } from "react-native";

describe("openCoffeeDirections", () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	it("uses the platform map URL when it is available", async () => {
		jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
		const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

		await expect(openCoffeeDirections({ latitude: 48.85, longitude: 2.35, label: "Café" })).resolves.toBe(true);

		expect(open).toHaveBeenCalledWith("maps:0,0?q=Caf%C3%A9@48.85,2.35");
	});

	it("falls back to a web map when no native handler is available", async () => {
		jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
		const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

		await openCoffeeDirections({ latitude: 48.85, longitude: 2.35, label: "Café" });

		expect(open).toHaveBeenCalledWith("https://www.google.com/maps/search/?api=1&query=48.85,2.35");
	});
});
