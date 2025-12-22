import {TicketsWlGateway} from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import {AuthTokenBridge} from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";


export class HttpTicketsGateway implements TicketsWlGateway {
    constructor(
        private readonly deps: {
            baseUrl: string;
            auth: AuthTokenBridge;
        }
    ) {}

    async verify(input: {
        commandId: string & { readonly __brand: "CommandId" };
        ticketId: string | undefined;
        imageRef: string | undefined;
        ocrText: string | null;
        at: string & { readonly __brand: "ISODate" };
    }): Promise<void> {
        const token = await this.deps.auth.getAccessToken();

        if (!token) {
            throw new Error("Not authenticated: missing access token");
        }

        // Backend exige un UUID non-null: UUID.fromString(body.ticketId())
        if (!input.ticketId) {
            throw new Error("ticketId is required (backend expects a UUID string)");
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

        const text = await res.text().catch(() => "");
        throw new Error(`Ticket verify failed: HTTP ${res.status} ${text}`);
    }
}
