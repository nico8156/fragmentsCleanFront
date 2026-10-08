import type { ExperienceGateway } from "@/app/core-logic/contextWL/experienceWl/gateway/experience.gateway";
import type { ExperiencePage, ExperienceReportReason } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { GatewayError, toGatewayErrorFromHttpResponse } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";
import { uploadPrivateFile } from "@/app/adapters/secondary/gateways/media/uploadPrivateFile";

export class HttpExperienceGateway implements ExperienceGateway {
	private readonly baseUrl: string;
	constructor(private readonly deps: { baseUrl: string; getAccessToken: () => Promise<string | null> }) { this.baseUrl = deps.baseUrl.replace(/\/+$/, ""); }
	private async token() { const token = await this.deps.getAccessToken(); if (!token) throw new GatewayError("auth", "Not authenticated"); return token; }
	private async list(path: string, input: { cursor?: string; limit?: number; signal: AbortSignal }): Promise<ExperiencePage> {
		const query = new URLSearchParams(); if (input.cursor) query.set("cursor", input.cursor); if (input.limit) query.set("limit", String(input.limit));
		const response = await fetch(`${this.baseUrl}${path}?${query}`, { headers: { Authorization: `Bearer ${await this.token()}`, Accept: "application/json" }, signal: input.signal });
		if (!response.ok) throw await toGatewayErrorFromHttpResponse(response, `Experience list failed with status ${response.status}`);
		const raw = await response.json() as any;
		return {
			items: Array.isArray(raw?.items) ? raw.items.map((item: any) => ({
				experienceId: String(item.experienceId), userId: String(item.authorId), coffeeId: String(item.coffeeId),
				authorName: item.authorName ?? "Utilisateur", avatarUrl: item.avatarUrl ?? null,
				message: String(item.message ?? ""), status: item.publicationStatus,
				moderationStatus: item.moderationStatus, createdAt: item.createdAt, updatedAt: item.updatedAt,
				publishedAt: item.publicationStatus === "PUBLISHED" ? item.updatedAt : null, version: Number(item.version ?? 0),
				media: Array.isArray(item.media) ? item.media.map((media: any) => ({ mediaId: String(media.mediaId), url: media.status && media.status !== "AVAILABLE" ? undefined : typeof media.url === "string" ? media.url : undefined, status: media.status === "REVIEW_REQUIRED" || media.status === "REJECTED" ? media.status : "AVAILABLE", width: media.width, height: media.height, position: Number(media.position ?? 0) })) : [],
			})) : [],
			nextCursor: raw?.nextCursor ?? null,
		};
	}
	listCoffee(input: { coffeeId: string; cursor?: string; limit?: number; signal: AbortSignal }) { return this.list(`/api/coffees/${input.coffeeId}/experiences`, input); }
	listMine(input: { cursor?: string; limit?: number; signal: AbortSignal }) { return this.list("/api/users/me/experiences", input); }
	private async send(path: string, method: string, body: unknown) {
		const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${await this.token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
		if (!response.ok && response.status !== 202 && response.status !== 204) throw await toGatewayErrorFromHttpResponse(response, `Experience command failed with status ${response.status}`);
	}
	create(input: { commandId: string; experienceId: string; coffeeId: string; message: string; publicationStatus: "DRAFT" | "PUBLISHED"; at: string }) { const { commandId, experienceId, coffeeId, message, publicationStatus, at } = input; return this.send("/api/experiences", "POST", { commandId, experienceId, coffeeId, message, publicationStatus, at }); }
	update(input: { commandId: string; experienceId: string; message: string; at: string }) { const { experienceId, commandId, message, at } = input; return this.send(`/api/experiences/${experienceId}`, "PATCH", { commandId, message, at }); }
	publish(input: { commandId: string; experienceId: string; at: string }) { const { experienceId, commandId, at } = input; return this.send(`/api/experiences/${experienceId}/publish`, "POST", { commandId, at }); }
	delete(input: { commandId: string; experienceId: string; at: string }) { const { experienceId, commandId, at } = input; return this.send(`/api/experiences/${experienceId}`, "DELETE", { commandId, at }); }
	report(input: { commandId: string; reportId: string; experienceId: string; reason: ExperienceReportReason; details?: string; at: string }) { const { experienceId, commandId, reportId, reason, details, at } = input; return this.send(`/api/experiences/${experienceId}/reports`, "POST", { commandId, reportId, reason, details, at }); }
	async uploadMedia(input: { commandId: string; mediaId: string; experienceId: string; image: import("@/app/core-logic/contextWL/experienceWl/typeAction/experience.type").LocalImageInput; at: string }) {
		const token = await this.token();
		const intent = await fetch(`${this.baseUrl}/api/experiences/${input.experienceId}/media/upload-intents`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ mediaId: input.mediaId, contentType: input.image.contentType, size: input.image.size }),
		});
		if (!intent.ok) {
			throw await toGatewayErrorFromHttpResponse(intent, `Experience media intent failed (${intent.status})`);
		}
		const target = await intent.json() as { uploadRequired: boolean; uploadUrl?: string; method?: string; headers?: Record<string, string> };
		if (target.uploadRequired) {
			if (!target.uploadUrl) throw new GatewayError("server", "Experience media upload target is missing");
			const uploaded = await uploadPrivateFile({ url: target.uploadUrl, method: target.method, headers: target.headers, localUri: input.image.localUri });
			if (!uploaded.ok) throw new GatewayError("server", `Media upload failed (${uploaded.status})`, uploaded.status);
		}
		const confirmed = await fetch(`${this.baseUrl}/api/experiences/${input.experienceId}/media/${input.mediaId}/confirm`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ commandId: input.commandId, at: input.at, moderationConsent: input.image.moderationConsent === true }),
		});
		if (!confirmed.ok) {
			throw await toGatewayErrorFromHttpResponse(confirmed, `Experience media confirmation failed (${confirmed.status})`);
		}
		// Keep the durable optimistic file until the remote projection replaces it.
	}
	deleteMedia(input: { commandId: string; mediaId: string; experienceId: string; at: string }) { const { experienceId, mediaId, commandId, at }=input;return this.send(`/api/experiences/${experienceId}/media/${mediaId}`,"DELETE",{ commandId, at }); }
}
