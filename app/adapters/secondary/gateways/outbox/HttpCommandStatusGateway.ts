import type { CommandStatusGateway, CommandStatusResult } from "@/app/core-logic/contextWL/outboxWl/gateway/commandStatus.gateway";
import type { AuthTokenBridge } from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";

type Deps = {
    baseUrl: string;
    authToken: AuthTokenBridge; // comme tes autres gateways
};

export class HttpCommandStatusGateway implements CommandStatusGateway {
    constructor(private deps: Deps) {}

    async getStatus(commandId: string): Promise<CommandStatusResult> {
        const token = await this.deps.authToken.getAccessToken?.();
        if (!token) return { status: "PENDING" }; // ou throw, selon ton choix

        const res = await fetch(`${this.deps.baseUrl}/commands/${encodeURIComponent(commandId)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!res.ok) {
            // 404 peut vouloir dire "pas encore enregistré" selon ton back -> PENDING
            if (res.status === 404) return { status: "PENDING" };
            throw new Error(`CommandStatusGateway failed: ${res.status}`);
        }

        const data = await res.json();

        // attendu côté back:
        // { status: "PENDING" | "APPLIED" | "REJECTED", appliedAt?, rejectedAt?, reason? }
        if (data?.status === "APPLIED") return { status: "APPLIED", appliedAt: data.appliedAt };
        if (data?.status === "REJECTED") return { status: "REJECTED", rejectedAt: data.rejectedAt, reason: data.reason };
        return { status: "PENDING" };
    }
}
