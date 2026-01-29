import type { OpeningHoursGateway } from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";
import type { OpeningHours } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

type HttpOpeningHoursGatewayDeps = {
	baseUrl: string;
};

// Payload back
type CoffeeOpeningHoursViewDto = {
	id: string;
	coffeeId: string;
	weekdayDescription: string;
};

export class HttpOpeningHoursGateway implements OpeningHoursGateway {
	private readonly baseUrl: string;

	constructor(deps: HttpOpeningHoursGatewayDeps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
	}

	async getAllOpeningHours(): Promise<{ data: OpeningHours[] }> {
		const headers: Record<string, string> = { Accept: "application/json" };

		const res = await fetch(`${this.baseUrl}/api/coffees/opening-hours`, { headers });
		if (!res.ok) throw new Error(`Coffee opening-hours list failed: HTTP ${res.status}`);

		const dtos = (await res.json()) as CoffeeOpeningHoursViewDto[];

		const data: OpeningHours[] = dtos.map((d) => ({
			id: String(d.id),
			coffee_id: String(d.coffeeId),
			weekday_description: String(d.weekdayDescription),
		}));

		return { data };
	}
}

