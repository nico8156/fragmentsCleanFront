import {TicketsWlGateway} from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import {AuthTokenBridge} from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";
import { GatewayError, toGatewayErrorFromHttpResponse } from "@/app/core-logic/contextWL/outboxWl/gateway/gatewayError";


export class HttpTicketsGateway implements TicketsWlGateway {
    constructor(
        private readonly deps: {
            baseUrl: string;
            auth: AuthTokenBridge;
        }
    ) {}

    async listHistory(input: { cursor?: string; limit: number; signal?: AbortSignal }) {
        const token = await this.deps.auth.getAccessToken();
        if (!token) throw new GatewayError("auth", "Not authenticated: missing access token");

        const query = new URLSearchParams({ limit: String(input.limit) });
        if (input.cursor) query.set("cursor", input.cursor);
        const res = await fetch(`${this.deps.baseUrl}/api/users/me/tickets?${query.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            signal: input.signal,
        });
        if (!res.ok) throw await toGatewayErrorFromHttpResponse(res, `Ticket history failed: HTTP ${res.status}`);

        const body: unknown = await res.json();
        if (!body || typeof body !== "object" || !Array.isArray((body as { items?: unknown }).items)) {
            throw new GatewayError("unknown", "Invalid ticket history response");
        }
        const page = body as { items: unknown[]; nextCursor?: unknown };
        return {
            items: page.items.map((candidate) => {
                if (!candidate || typeof candidate !== "object") {
                    throw new GatewayError("unknown", "Invalid ticket history item");
                }
                const item = candidate as Record<string, unknown>;
                if (typeof item.ticketId !== "string" || typeof item.status !== "string" || typeof item.version !== "number") {
                    throw new GatewayError("unknown", "Invalid ticket history item");
                }
                const optionalString = (key: string) => typeof item[key] === "string" ? item[key] as string : null;
                return {
                    ticketId: item.ticketId,
                    status: item.status,
                    outcome: optionalString("outcome"),
                    amountCents: typeof item.amountCents === "number" ? item.amountCents : null,
                    currency: optionalString("currency"),
                    ticketDate: optionalString("ticketDate"),
                    merchantName: optionalString("merchantName"),
                    merchantAddress: optionalString("merchantAddress"),
                    rejectionReason: optionalString("rejectionReason"),
                    version: item.version,
                    occurredAt: optionalString("occurredAt"),
                };
            }),
            nextCursor: typeof page.nextCursor === "string" ? page.nextCursor : null,
        };
    }

    async getStatus(input: {
        ticketId: string;
        signal?: AbortSignal;
    }): Promise<{
        ticketId: string;
        status: string;
        outcome?: string | null;
        imageRef?: string | null;
        ocrText?: string | null;
        amountCents?: number | null;
        currency?: string | null;
        ticketDate?: string | null;
        merchantName?: string | null;
        merchantAddress?: string | null;
        paymentMethod?: string | null;
        rejectionReason?: string | null;
        version: number;
        occurredAt?: string | null;
        updatedAt?: string | null;
    }> {
        const token = await this.deps.auth.getAccessToken();

        if (!token) {
            throw new GatewayError("auth", "Not authenticated: missing access token");
        }

        const res = await fetch(
            `${this.deps.baseUrl}/api/tickets/${encodeURIComponent(input.ticketId)}/status`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal: input.signal,
            },
        );

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Ticket status failed: HTTP ${res.status} ${text}`);
        }

        return await res.json();
    }

    async verify(input: {
        commandId: string & { readonly __brand: "CommandId" };
        ticketId: string | undefined;
        imageRef: string | undefined;
        ocrText: string | null;
        at: string & { readonly __brand: "ISODate" };
    }): Promise<void> {
        const token = await this.deps.auth.getAccessToken();

        if (!token) {
            throw new GatewayError("auth", "Not authenticated: missing access token");
        }

        // Backend exige un UUID non-null: UUID.fromString(body.ticketId())
        if (!input.ticketId) {
            throw new GatewayError("unknown", "ticketId is required (backend expects a UUID string)");
        }

        const res = await fetch(`${this.deps.baseUrl}/api/tickets/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                commandId: input.commandId,
                ticketId: input.ticketId,
                imageRef: input.imageRef ?? null,
                ocrText: input.ocrText ?? null,
                clientAt: input.at,
            }),
        });

        if (res.status === 202) return;

        throw await toGatewayErrorFromHttpResponse(res, `Ticket verify failed: HTTP ${res.status}`);
    }
}
