import {createAction} from "@reduxjs/toolkit";
import {EntitlementsThresholds, UserEntitlements} from "@/app/contextWL/entitlementWl/typeAction/entitlement.type";

export const entitlementsSetThresholds = createAction<Partial<EntitlementsThresholds>>("SERVER/ENTITLEMENT/SET_THRESHOLDS")
export const entitlementsHydrated = createAction<Omit<UserEntitlements, "rights">>('SERVER/ENTITLEMENT/HYDRATED')