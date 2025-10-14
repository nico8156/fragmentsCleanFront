import {AppThunk} from "@/app/store/reduxStoreWl";
import {createAction} from "@reduxjs/toolkit";
import {CafeId, CommentDTO, ListCommentsResponse} from "@/app/contextWL/commentWl/type/commentWl.type";

export const commentRetrievedWl = createAction<{targetId:CafeId, items:CommentDTO[], nextCursor:string, serverTime:string}>('commentRetrievedWl')

export const commentRetrieval = ({targetId,cursor,limit}:{targetId:CafeId, cursor: string, limit: number}) : AppThunk<Promise<void>> =>
    async (dispatch, _, {
        gateways:{
            comments: commentGatewayWl
        },
        helpers:{}
    }) => {
    try {
        const res = await commentGatewayWl?.list({targetId,cursor,limit})
        dispatch(commentRetrievedWl({targetId, items:res!.items, nextCursor:res!.nextCursor, serverTime:res!.serverTime }))
    } catch (e) {

    }
    }
