import {UserEntitlements} from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";

export interface EntitlementWlGateway {
    get(input: {
        userId: string;
        ifNoneMatch?: string;
    }): Promise<{ etag?: string; data: UserEntitlements }>;
}