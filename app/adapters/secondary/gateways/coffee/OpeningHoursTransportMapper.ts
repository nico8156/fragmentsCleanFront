import type { OpeningHours } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export function mapOpeningHours(payload: unknown): OpeningHours[] {
	if (!Array.isArray(payload)) throw new Error("Invalid coffee opening-hours response: expected array");
	return payload.map((item, index) => {
		if (!item || typeof item !== "object") throw new Error(`Invalid opening hours at index ${index}`);
		const dto = item as Record<string, unknown>;
		if (typeof dto.id !== "string" || !dto.id.trim()) throw new Error(`Invalid opening hours id at index ${index}`);
		if (typeof dto.coffeeId !== "string" || !dto.coffeeId.trim()) throw new Error(`Invalid opening hours coffeeId at index ${index}`);
		if (typeof dto.weekdayDescription !== "string" || !dto.weekdayDescription.trim()) throw new Error(`Invalid weekday description at index ${index}`);
		return { id: dto.id, coffee_id: dto.coffeeId, weekday_description: dto.weekdayDescription };
	});
}
