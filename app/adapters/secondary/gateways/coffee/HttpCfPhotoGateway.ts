import type { CfPhotoGateway } from "@/app/core-logic/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import type { PhotoURI } from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.type";
import { mapCoffeePhotos } from "./CoffeePhotoTransportMapper";

type HttpCfPhotoGatewayDeps = {
	baseUrl: string;
};

export class HttpCfPhotoGateway implements CfPhotoGateway {
	private readonly baseUrl: string;

	constructor(deps: HttpCfPhotoGatewayDeps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
	}

	async getAllphotos(): Promise<{ data: PhotoURI[] }> {
		const headers: Record<string, string> = { Accept: "application/json" };

		const res = await fetch(`${this.baseUrl}/api/coffees/photos`, { headers });
		if (!res.ok) throw new Error(`Coffee photos list failed: HTTP ${res.status}`);

		const data = mapCoffeePhotos(await res.json());

		return { data };
	}
}
