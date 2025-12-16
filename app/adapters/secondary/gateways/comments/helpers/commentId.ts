import { v5 as uuidv5 } from "uuid";

const COMMENT_NAMESPACE = "b27b8e6e-5f25-4b6a-8f6a-2d7a0c0c7c22";

export const computeCommentId = (tempId: string): string =>
    uuidv5(`comment:${tempId}`, COMMENT_NAMESPACE);
