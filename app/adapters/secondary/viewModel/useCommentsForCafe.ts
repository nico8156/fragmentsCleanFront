import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectCommentsForTarget } from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";
import {
    CafeId,
    CommentEntity,
    LoadingState,
    loadingStates,
    moderationTypes,
    opTypes,
} from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import { commentRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/commentRetrieval";
import {uiCommentCreateRequested} from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

const AVATAR_BASE_URL = "https://i.pravatar.cc/120";

export type CommentItemVM = {
    id: string;
    authorName: string;
    avatarUrl: string;
    body: string;
    createdAt: string;
    relativeTime: string;
    isOptimistic: boolean;
};

type CommentsSelectorResult = {
    comments: CommentEntity[];
    loading: LoadingState;
    error?: string;
    lastFetchedAt?: string;
    staleAfterMs: number;
};

const toAvatarUrl = (authorId: string) => `${AVATAR_BASE_URL}?u=${encodeURIComponent(authorId)}`;

const formatRelativeTime = (isoDate: string): string => {
    const createdAt = new Date(isoDate);
    if (Number.isNaN(createdAt.getTime())) {
        return "Date inconnue";
    }

    const diffMs = Date.now() - createdAt.getTime();
    const diffSec = Math.max(1, Math.floor(diffMs / 1000));

    if (diffSec < 60) return "À l'instant";

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Il y a ${diffDays} j`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `Il y a ${diffWeeks} sem`;

    return createdAt.toLocaleDateString("fr-FR");
};

export function useCommentsForCafe(targetId?: CafeId) {
    const dispatch = useDispatch<any>();

    const uiViaHookCreateComment = ({targetId, body}:{targetId:CoffeeId, body:string}) => {
        dispatch(uiCommentCreateRequested({targetId, body}))
    }

    const selector = useMemo(() => {
        if (!targetId) {
            return () => ({
                comments: [],
                loading: loadingStates.IDLE,
                error: undefined,
                lastFetchedAt: undefined,
                staleAfterMs: 30_000,
            }) as CommentsSelectorResult;
        }
        return selectCommentsForTarget(targetId);
    }, [targetId]);

    const { comments, loading, error, lastFetchedAt, staleAfterMs } = useSelector(selector);

    const viewModel: CommentItemVM[] = useMemo(
        () =>
            comments
                .filter((comment) => !comment.deletedAt && comment.moderation !== moderationTypes.SOFT_DELETED)
                .map((comment) => ({
                    id: comment.id,
                    authorName: comment.authorId,
                    avatarUrl: toAvatarUrl(comment.authorId),
                    body: comment.body,
                    createdAt: comment.createdAt,
                    relativeTime: formatRelativeTime(comment.createdAt),
                    isOptimistic: Boolean(comment.optimistic),
                })),
        [comments],
    );

    useEffect(() => {
        if (!targetId) return;
        if (loading === loadingStates.PENDING) return;

        const hasFetchedOnce = Boolean(lastFetchedAt);
        const lastFetchTime = lastFetchedAt ? Date.parse(lastFetchedAt) : 0;
        const isStale = Date.now() - lastFetchTime > staleAfterMs;

        if (!hasFetchedOnce) {
            dispatch(commentRetrieval({ targetId, op: opTypes.RETRIEVE, cursor: "",limit:10 }));
            return;
        }

        if (isStale) {
            dispatch(commentRetrieval({ targetId, op: opTypes.REFRESH, cursor: "",limit:10 }));
        }
    }, [dispatch, targetId, loading, lastFetchedAt, staleAfterMs]);

    const isLoading = loading === loadingStates.PENDING && viewModel.length === 0;
    const isRefreshing = loading === loadingStates.PENDING && viewModel.length > 0;

    return {
        comments: viewModel,
        isLoading,
        error,
        isRefreshing,
        uiViaHookCreateComment
    } as const;
}
