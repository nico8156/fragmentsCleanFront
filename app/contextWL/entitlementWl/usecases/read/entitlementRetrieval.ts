import {entitlementsHydrated} from "@/app/contextWL/entitlementWl/reducer/entitlementWl.reducer";
import {ISODate} from "@/app/contextWL/outboxWl/type/outbox.type";

export const entitlementsRetrieval =
    (input: { userId: string }) =>
        async (dispatch: any, getState: any, dependencies: any) => {
            // Si tu as un gateway:
            if (dependencies?.gateways?.entitlements?.get) {
                const res = await dependencies.gateways.entitlements.get({ userId: input.userId });
                dispatch(
                    entitlementsHydrated({
                        userId: input.userId,
                        confirmedTickets: res.confirmedTickets,
                        rights: res.rights, // ou laisse vide pour recalculer côté reducer
                        updatedAt: res.updatedAt,
                    })
                );
                return;
            }
            // Sinon, no-op ou seed vide
            dispatch(
                entitlementsHydrated({
                    userId: input.userId,
                    confirmedTickets: 0,
                    rights: [],
                    updatedAt: new Date().toISOString() as ISODate,
                })
            );
        };
