import {createAction} from "@reduxjs/toolkit";
import {UserEntitlementsSnapshot} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";

export const entitlementsHydrated = createAction<UserEntitlementsSnapshot>('SERVER/ENTITLEMENT/HYDRATED')
