import type { PhotoURI } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.type";

export function mapCoffeePhotos(payload: unknown): PhotoURI[] {
	if (!Array.isArray(payload)) throw new Error("Invalid coffee photos response: expected array");
	return payload.map((item, index) => {
		if (!item || typeof item !== "object") throw new Error(`Invalid coffee photo at index ${index}`);
		const dto = item as Record<string, unknown>;
		if (typeof dto.id !== "string" || !dto.id.trim()) throw new Error(`Invalid coffee photo id at index ${index}`);
		if (typeof dto.coffeeId !== "string" || !dto.coffeeId.trim()) throw new Error(`Invalid coffee photo coffeeId at index ${index}`);
		if (typeof dto.photoUri !== "string" || !dto.photoUri.trim()) throw new Error(`Invalid coffee photo URI at index ${index}`);
		return { id: dto.id, coffee_id: dto.coffeeId, photo_uri: dto.photoUri };
	});
}
