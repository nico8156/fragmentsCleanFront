// app/adapters/secondary/gateways/auth/HttpUserRepo.ts
import type { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import type { AppUser } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import type { ISODate } from "@/app/core-logic/contextWL/userWl/typeAction/user.type"; // ou ton ISODate central

type Deps = {
    baseUrl: string;
    getAccessToken: () => Promise<string | null>;
};

type MeResponseDto = {
    userId: string;        // UUID string (le JSON du record)
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
        this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
        this.getAccessToken = deps.getAccessToken;
    }

    // NOTE: l’ID est ignoré, car l’API /auth/me dérive l’identité du JWT
    async getById(_id: AppUser["id"]): Promise<AppUser | null> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(`${this.baseUrl}/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (res.status === 401) return null;
        if (!res.ok) throw new Error(`GET /auth/me failed (${res.status})`);

        const dto = (await res.json()) as MeResponseDto;

        // Ton back renvoie Instant => ISO string, donc OK.
        const now = toISO(dto.serverTime);

        return {
            id: dto.userId as any,          // <- UUID (AppUser.id)
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
}
