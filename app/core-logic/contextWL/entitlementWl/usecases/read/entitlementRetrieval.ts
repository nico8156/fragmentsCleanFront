
import {ISODate} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {entitlementsHydrated} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.action";
import { logger } from "@/app/core-logic/utils/logger";

export const entitlementsRetrieval =
    (input: { userId: string }) :  AppThunkWl<Promise<void>> =>
        async (dispatch, _, gateways) => {
            if(!gateways?.entitlements){
                logger.warn("[ENTITLEMENTS] retrieval:fallback_no_gateway", { userId: input.userId });
                dispatch(
                    entitlementsHydrated({
                        userId: input.userId,
                        confirmedTickets: 0,
                        updatedAt: new Date().toISOString() as ISODate,
                    })
                );
                return;
            }
            try{
                logger.info("[ENTITLEMENTS] retrieval:start", { userId: input.userId });
                const res = await gateways.entitlements.get({ userId: input.userId})
                dispatch(
                    entitlementsHydrated({
                        userId: res.data.userId ?? input.userId,
                        confirmedTickets: res.data.confirmedTickets,
                        publishedComments: res.data.publishedComments,
                        confirmedLikes: res.data.confirmedLikes,
                        rights: res.data.rights,
                        updatedAt: res.data.updatedAt,
                        pass: res.data.pass,
                    })
                );
                logger.info("[ENTITLEMENTS] retrieval:succeeded", {
                    userId: res.data.userId ?? input.userId,
                    confirmedTickets: res.data.confirmedTickets,
                    publishedComments: res.data.publishedComments,
                    confirmedLikes: res.data.confirmedLikes,
                    currentLevel: res.data.pass?.currentLevel,
                });
            }catch (e){
                logger.warn("[ENTITLEMENTS] retrieval:failed", {
                    userId: input.userId,
                    error: String((e as any)?.message ?? e),
                });
            }finally {
                return;
            }
        };
