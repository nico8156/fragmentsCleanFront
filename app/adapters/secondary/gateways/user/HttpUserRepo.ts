// app/adapters/secondary/gateways/user/HttpUserRepo.ts
import type { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import type { AppUser, ISODate } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";

type Deps = {
	baseUrl: string;
	getAccessToken: () => Promise<string | null>;
};

type MeResponseDto = {
	userId: string; // UUID string
	displayName?: string;
	avatarUrl?: string | null; // ✅ NEW (from /auth/me)
	issuedAt?: string;
	expiresAt?: string;
	serverTime?: string;
};

const toISO = (s?: string): ISODate => (s ?? new Date().toISOString()) as any;

export class HttpUserRepo implements UserRepo {
	private readonly baseUrl: string;
	private readonly getAccessToken: () => Promise<string | null>;

	constructor(deps: Deps) {
		this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
		this.getAccessToken = deps.getAccessToken;
	}

	// NOTE: l’ID est ignoré, car l’API /auth/me dérive l’identité du JWT
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

		// petit log utile (tu l'avais déjà côté app)
		console.log("[USER REPO] GET", { status: res.status, url });

		if (res.status === 401) return null;
		if (!res.ok) throw new Error(`GET /auth/me failed (${res.status})`);

		const dto = (await res.json()) as MeResponseDto;

		const now = toISO(dto.serverTime);

		return {
			id: dto.userId as any,
			createdAt: now,
			updatedAt: now,
			displayName: dto.displayName,
			avatarUrl: dto.avatarUrl ?? undefined, // ✅ FIX ICI
			bio: undefined,
			identities: [],
			roles: ["user"],
			flags: {},
			preferences: { locale: "fr-FR", theme: "system" } as any,
			likedCoffeeIds: [],
			version: 1,
		} as AppUser;
	}
}

