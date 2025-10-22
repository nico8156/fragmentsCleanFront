import {entitlementsHydrated} from "@/app/contextWL/entitlementWl/reducer/entitlementWl.reducer";
import {ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";
import {AppThunkWl} from "@/app/store/reduxStoreWl";

export const entitlementsRetrieval =
    (input: { userId: string }) :  AppThunkWl<Promise<void>> =>
        async (dispatch, _, entitlementWlGateway) => {
            if(!entitlementWlGateway?.entitlements){
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
                const res = await entitlementWlGateway.entitlements.get({ userId: input.userId})
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
