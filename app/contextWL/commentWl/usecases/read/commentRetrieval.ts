import {AppThunk} from "@/app/store/reduxStoreWl";
import {createAction} from "@reduxjs/toolkit";
import {CafeId} from "@/app/contextWL/commentWl/type/commentWl.type";

export const commentRetrievedWl = createAction<{}>('commentRetrievedWl')

export const commentRetrieval = ({targetId,cursor,limit}:{targetId:CafeId, cursor: string, limit: number}) : AppThunk<Promise<void>> =>
    async (dispatch, _, {
        gateways:{
            comments: commentGatewayWl
        },
        helpers:{}
    }) => {
    try {
        const res = await commentGatewayWl?.list({targetId,cursor,limit })
        dispatch(commentRetrievedWl({targetId, items:res.items, nextCursor:res.nextCursor, serverTime:res. }))
    } catch (e) {

    }

    }
