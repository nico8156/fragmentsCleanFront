import type { OpeningHoursGateway } from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";
import type { OpeningHours } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";
import { mapOpeningHours } from "./OpeningHoursTransportMapper";

type HttpOpeningHoursGatewayDeps = {
	baseUrl: string;
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

		const data = mapOpeningHours(await res.json());

		return { data };
	}
}
