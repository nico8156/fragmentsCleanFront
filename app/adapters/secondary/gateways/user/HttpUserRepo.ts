// app/adapters/secondary/gateways/user/HttpUserRepo.ts
import type { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import type { AppUser, ISODate } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { GatewayError, toGatewayErrorFromHttpResponse } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";

type Deps = {
	baseUrl: string;
	getAccessToken: () => Promise<string | null>;
};

type MeResponseDto = {
	userId: string;
	displayName?: string;
	avatarUrl?: string | null;
	createdAt: string;
	updatedAt: string;
	version: number;
};

export class HttpUserRepo implements UserRepo {
	private readonly baseUrl: string;
	private readonly getAccessToken: () => Promise<string | null>;

	constructor(deps: Deps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
		this.getAccessToken = deps.getAccessToken;
	}

	// The backend derives identity from the JWT; the argument only belongs to the client port.
	async getById(_id: AppUser["id"]): Promise<AppUser | null> {
		const token = await this.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");

		const url = `${this.baseUrl}/api/users/me`;

		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});

		if (res.status === 401) return null;
		if (!res.ok) throw await toGatewayErrorFromHttpResponse(res, `GET /api/users/me failed (${res.status})`);

		const dto = (await res.json()) as MeResponseDto;

		return {
			id: dto.userId as any,
			createdAt: dto.createdAt as ISODate,
			updatedAt: dto.updatedAt as ISODate,
			displayName: dto.displayName,
			avatarUrl: dto.avatarUrl ?? undefined, // ✅ FIX ICI
			bio: undefined,
			identities: [],
			roles: ["user"],
			flags: {},
			preferences: { locale: "fr-FR", theme: "system" } as any,
			likedCoffeeIds: [],
			version: dto.version,
		} as AppUser;
	}

	async updateProfile(input: { commandId: string; displayName: string }): Promise<void> {
		const token = await this.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");
		const response = await fetch(`${this.baseUrl}/api/users/me/profile`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(input),
		});
		if (!response.ok) {
			throw await toGatewayErrorFromHttpResponse(response, `Profile update failed (${response.status})`);
		}
	}

	async requestAccountDeletion(input: { commandId: string }): Promise<void> {
		const token = await this.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");
		const response = await fetch(`${this.baseUrl}/api/users/me`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
		if (!response.ok) {
			throw await toGatewayErrorFromHttpResponse(response, `Account deletion failed (${response.status})`);
		}
	}
}
