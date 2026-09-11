// app/adapters/secondary/gateways/user/HttpUserRepo.ts
import type { UserRepo } from "@/app/core-logic/contextWL/userWl/gateway/user.gateway";
import type { AppUser, ISODate } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import type { LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { GatewayError, isGatewayError, toGatewayErrorFromHttpResponse } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";
import { File } from "expo-file-system";

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

	async uploadAvatar(input: { commandId: string; mediaId: string; image: LocalImageInput; at: string }): Promise<void> {
		const token = await this.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");
		const authorization = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
		const intentResponse = await fetch(`${this.baseUrl}/api/users/me/avatar/upload-intents`, {
			method: "POST",
			headers: authorization,
			body: JSON.stringify({ mediaId: input.mediaId, contentType: input.image.contentType, size: input.image.size }),
		});
		if (!intentResponse.ok) {
			const error = await toGatewayErrorFromHttpResponse(intentResponse, `Avatar upload intent failed (${intentResponse.status})`);
			if (isGatewayError(error) && error.kind === "business") this.discardLocalImage(input.image.localUri);
			throw error;
		}
		const target = await intentResponse.json() as { uploadRequired: boolean; uploadUrl?: string; method?: string; headers?: Record<string, string> };
		if (target.uploadRequired) {
			if (!target.uploadUrl) throw new GatewayError("server", "Avatar upload target is missing");
			const file = new File(input.image.localUri);
			const uploaded = await fetch(target.uploadUrl, {
				method: target.method ?? "PUT",
				headers: target.headers ?? {},
				body: file as any,
			});
			if (!uploaded.ok) throw new GatewayError("server", `Avatar upload failed (${uploaded.status})`, uploaded.status);
		}
		const confirmation = await fetch(`${this.baseUrl}/api/users/me/avatar/${input.mediaId}/confirm`, {
			method: "POST",
			headers: authorization,
			body: JSON.stringify({ commandId: input.commandId, at: input.at }),
		});
		if (!confirmation.ok) {
			const error = await toGatewayErrorFromHttpResponse(confirmation, `Avatar confirmation failed (${confirmation.status})`);
			if (isGatewayError(error) && error.kind === "business") this.discardLocalImage(input.image.localUri);
			throw error;
		}
		try {
			const file = new File(input.image.localUri);
			if (file.exists) file.delete();
		} catch {
			// The durable command has been accepted. Local cleanup can be retried by the OS.
		}
	}

	private discardLocalImage(uri: string) {
		try {
			const file = new File(uri);
			if (file.exists) file.delete();
		} catch {
			// App-owned private storage: cleanup remains best effort.
		}
	}

	async removeAvatar(input: { commandId: string; at: string }): Promise<void> {
		const token = await this.getAccessToken();
		if (!token) throw new GatewayError("auth", "Not authenticated");
		const response = await fetch(`${this.baseUrl}/api/users/me/avatar`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
		if (!response.ok) {
			throw await toGatewayErrorFromHttpResponse(response, `Avatar removal failed (${response.status})`);
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
