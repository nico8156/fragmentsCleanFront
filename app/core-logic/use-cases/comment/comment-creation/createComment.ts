import {AppThunk} from "@/app/store/reduxStore";


export const createComment =
    (userId:string, commentId: string, content:string ):AppThunk<Promise<void>> =>
        async (dispatch, _, {commentGateway}) => {
        //TODO check validation for creating a comment

        //TODO dispatch action commentCreated if validation ok
            await commentGateway.saveComment(userId, commentId, content);
        //TODO if not, dispatch action invalidComment
        };