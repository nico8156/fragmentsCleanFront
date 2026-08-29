import type { Coffee } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { parseToCoffeeId, parseToISODate } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export function mapCoffeeSummaryTransport(input: unknown): Coffee {
	const value = object(input, "coffee");
	const location = object(value.location, "coffee.location");
	const address = object(value.address, "coffee.address");
	if (value.publicationStatus !== "PUBLISHED") throw new Error("Invalid coffee.publicationStatus");

	return {
		id: parseToCoffeeId(string(value.id, "coffee.id")),
		googleId: optionalString(value.googleId, "coffee.googleId"),
		name: string(value.name, "coffee.name"),
		location: {
			lat: finiteNumber(location.lat, "coffee.location.lat"),
			lon: finiteNumber(location.lon, "coffee.location.lon"),
		},
		address: {
			line1: optionalString(address.line1, "coffee.address.line1"),
			city: optionalString(address.city, "coffee.address.city"),
			postalCode: optionalString(address.postalCode, "coffee.address.postalCode"),
			country: optionalString(address.country, "coffee.address.country"),
		},
		phoneNumber: optionalString(value.phoneNumber, "coffee.phoneNumber"),
		website: optionalString(value.website, "coffee.website"),
		tags: array(value.tags, "coffee.tags").map((tag) => string(tag, "coffee.tags[]")),
		version: nonNegativeInteger(value.version, "coffee.version"),
		updatedAt: parseToISODate(isoDate(value.updatedAt, "coffee.updatedAt")),
	};
}

function object(value: unknown, path: string): Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${path}`);
	return value as Record<string, unknown>;
}
function array(value: unknown, path: string): unknown[] {
	if (!Array.isArray(value)) throw new Error(`Invalid ${path}`);
	return value;
}
function string(value: unknown, path: string): string {
	if (typeof value !== "string" || value.trim() === "") throw new Error(`Invalid ${path}`);
	return value;
}
function optionalString(value: unknown, path: string): string | undefined {
	return value == null ? undefined : string(value, path);
}
function finiteNumber(value: unknown, path: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid ${path}`);
	return value;
}
function nonNegativeInteger(value: unknown, path: string): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new Error(`Invalid ${path}`);
	return value;
}
function isoDate(value: unknown, path: string): string {
	const candidate = string(value, path);
	if (Number.isNaN(Date.parse(candidate))) throw new Error(`Invalid ${path}`);
	return candidate;
}
