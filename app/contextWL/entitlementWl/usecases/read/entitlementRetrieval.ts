
import {ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";
import {entitlementsHydrated} from "@/app/contextWL/entitlementWl/typeAction/entitlement.action";

export const entitlementsRetrieval =
    (input: { userId: string }) :  AppThunkWl<Promise<void>> =>
        async (dispatch, _, gateways) => {
            if(!gateways?.entitlements){
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
                const res = await gateways.entitlements.get({ userId: input.userId})
                dispatch(
                    entitlementsHydrated({
                        userId: input.userId,
                        confirmedTickets: res.data.confirmedTickets,
                        updatedAt: res.data.updatedAt,
                    })
                );
            }catch (e){
                console.log("error in entitlementsRetrieval", e);
            }finally {
                return;
            }
        };
