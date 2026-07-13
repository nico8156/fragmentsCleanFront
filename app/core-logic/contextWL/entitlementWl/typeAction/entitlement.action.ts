import {createAction} from "@reduxjs/toolkit";
import {EntitlementsThresholds, UserEntitlementsSnapshot} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";

export const entitlementsSetThresholds = createAction<Partial<EntitlementsThresholds>>("SERVER/ENTITLEMENT/SET_THRESHOLDS")
export const entitlementsHydrated = createAction<UserEntitlementsSnapshot>('SERVER/ENTITLEMENT/HYDRATED')
