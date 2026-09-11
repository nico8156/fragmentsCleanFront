import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import type { GatewaysWl } from "@/app/adapters/primary/wiring/types";
import { blockedUsersFailed, blockedUsersPending, blockedUsersRetrieved } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.action";

export const blockedUsersRetrieval = createAsyncThunk<void,void,{state:RootStateWl;extra:Partial<GatewaysWl>}>(
    "COMMENT/BLOCKED_USERS_RETRIEVE", async (_,api) => {
        api.dispatch(blockedUsersPending());
        const controller=new AbortController();
        try { api.dispatch(blockedUsersRetrieved({items:await api.extra.comments!.listBlockedUsers(controller.signal)})); }
        catch (error:any) { api.dispatch(blockedUsersFailed({error:error?.message ?? "Impossible de charger les utilisateurs bloqués."})); }
    },
);
