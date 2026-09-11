import type { ExperienceGateway } from "@/app/core-logic/contextWL/experienceWl/gateway/experience.gateway";
import type { ExperiencePage, ExperienceReportReason } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { GatewayError, toGatewayErrorFromHttpResponse } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";

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
	create(input: { commandId: string; experienceId: string; coffeeId: string; message: string; publicationStatus: "DRAFT" | "PUBLISHED"; at: string }) { return this.send("/api/experiences", "POST", input); }
	update(input: { commandId: string; experienceId: string; message: string; at: string }) { const { experienceId, ...body } = input; return this.send(`/api/experiences/${experienceId}`, "PATCH", body); }
	publish(input: { commandId: string; experienceId: string; at: string }) { const { experienceId, ...body } = input; return this.send(`/api/experiences/${experienceId}/publish`, "POST", body); }
	delete(input: { commandId: string; experienceId: string; at: string }) { const { experienceId, ...body } = input; return this.send(`/api/experiences/${experienceId}`, "DELETE", body); }
	report(input: { commandId: string; reportId: string; experienceId: string; reason: ExperienceReportReason; details?: string; at: string }) { const { experienceId, ...body } = input; return this.send(`/api/experiences/${experienceId}/reports`, "POST", body); }
}
