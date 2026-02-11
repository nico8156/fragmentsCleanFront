import type { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import type { AppUser, ISODate, UserId } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

type Deps = {
	baseUrl: string;
	getAccessToken: () => Promise<string | null>;
};

type MeResponseDto = {
	userId: string; // UUID
	displayName?: string;
	issuedAt?: string;
	expiresAt?: string;
	serverTime?: string;
};

const toISO = (s?: string): ISODate => (s ?? new Date().toISOString()) as any;

export class HttpUserRepo implements UserRepo {
	private readonly baseUrl: string;
	private readonly getAccessToken: () => Promise<string | null>;

	constructor(deps: Deps) {
		const raw = deps.baseUrl?.trim();
		if (!raw) throw new Error("[HttpUserRepo] baseUrl is empty/undefined");
		this.baseUrl = raw.replace(/\/+$/, "");
		this.getAccessToken = deps.getAccessToken;
	}

	private mapMeToAppUser(dto: MeResponseDto): AppUser {
		const now = toISO(dto.serverTime);
		return {
			id: dto.userId as UserId,
			createdAt: now,
			updatedAt: now,
			displayName: dto.displayName,
			avatarUrl: undefined,
			bio: undefined,
			identities: [],
			roles: ["user"],
			flags: {},
			preferences: { locale: "fr-FR", theme: "system" } as any,
			likedCoffeeIds: [],
			version: 1,
		} as AppUser;
	}

	async getById(_id: AppUser["id"]): Promise<AppUser | null> {
		const token = await this.getAccessToken();
		if (!token) throw new Error("Not authenticated");

		const url = `${this.baseUrl}/auth/me`;

		const res = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});

		console.log("[USER REPO] GET", { url, status: res.status });

		// 401 => session invalide
		if (res.status === 401) return null;

		// 404 => profil pas encore provisionné côté backend
		if (res.status === 404) {
			throw new Error("GET /auth/me failed (404)");
		}

		if (!res.ok) {
			const body = await res.text().catch(() => "");
			throw new Error(`GET /auth/me failed (${res.status}) ${body}`.trim());
		}

		const dto = (await res.json()) as MeResponseDto;
		return this.mapMeToAppUser(dto);
	}
}

