import {EntitlementWlGateway} from "@/app/contextWL/entitlementWl/gateway/entitlementWl.gateway";
import { UserEntitlements } from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";

export class FakeEntitlementWlGateway implements EntitlementWlGateway {
    willFailGet = false;
    store = new Map<string, UserEntitlements>();

    nextEtag?: string;

    async get({ userId }: { userId: string }) {
        if (this.willFailGet) throw new Error("entitlements get failed");
        const data =
            this.store.get(userId) ??
            ({
                userId: authorId,
                confirmedTickets: 0,
                updatedAt: new Date(0).toISOString(),
            } as UserEntitlements);
        return { etag: this.nextEtag, data };
    }

}