import { useEffect, useMemo, useCallback } from "react";
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
import { uiCommentCreateRequested } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentCreateWlUseCase";
import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { commandKinds, statusTypes } from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";
import {
    DEFAULT_COMMUNITY_PROFILE,
    getCommunityProfile,
} from "@/app/adapters/secondary/fakeData/communityProfiles";
import { selectCurrentUser } from "@/app/core-logic/contextWL/userWl/selector/user.selector";

const buildFallbackAvatarUrl = (id: string) => `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

const normalizeAuthorId = (authorId: string) => {
    const parts = authorId.split(":").filter(Boolean);
    return parts[parts.length - 1] ?? authorId;
};

export type CommentItemVM = {
    id: string;
    authorName: string;
    avatarUrl: string;
    body: string;
    createdAt: string;
    relativeTime: string;
    isOptimistic: boolean;
    transportStatus: "pending" | "success" | "failed";
};

type CommentsSelectorResult = {
    comments: CommentEntity[];
    loading: LoadingState;
    error?: string;
    lastFetchedAt?: string;
    staleAfterMs: number;
};

const EMPTY_COMMENTS_RESULT: CommentsSelectorResult = {
    comments: [],
    loading: loadingStates.IDLE,
    error: undefined,
    lastFetchedAt: undefined,
    staleAfterMs: 30_000,
};

// Selector "safe" pour le cas sans targetId : toujours la même ref
const selectEmptyComments: (state: RootStateWl) => CommentsSelectorResult = () =>
    EMPTY_COMMENTS_RESULT;

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

    const currentUser = useSelector(selectCurrentUser);

    const uiViaHookCreateComment = useCallback(
        ({ targetId, body }: { targetId: CoffeeId; body: string }) => {
            dispatch(uiCommentCreateRequested({ targetId, body }));
        },
        [dispatch],
    );

    // IMPORTANT : on ne crée plus un () => ({...}) à chaque fois
    const selector = useMemo(() => {
        if (!targetId) {
            return selectEmptyComments;
        }
        return selectCommentsForTarget(targetId); // factory Reselect, OK
    }, [targetId]);

    const { comments, loading, error, lastFetchedAt, staleAfterMs } =
        useSelector(selector);

    const outboxRecords = useSelector((state: RootStateWl) => state.oState.byId);

    const outboxStatusByTempId = useMemo(() => {
        const result: Record<string, string> = {};
        Object.values(outboxRecords ?? {}).forEach((record: any) => {
            const command = record?.item?.command;
            if (!command) return;
            if (command.kind === commandKinds.CommentCreate) {
                result[command.tempId] = record.status;
            }
        });
        return result;
    }, [outboxRecords]);

    const viewModel: CommentItemVM[] = useMemo(
        () =>
            comments
                .filter(
                    (comment) =>
                        !comment.deletedAt &&
                        comment.moderation !== moderationTypes.SOFT_DELETED,
                )
                .map((comment) => {
                    const normalizedAuthorId = normalizeAuthorId(comment.authorId);
                    const isCurrentUser = currentUser?.id === comment.authorId;
                    const communityProfile = getCommunityProfile(normalizedAuthorId);

                    return {
                        id: comment.id,
                        authorName: isCurrentUser
                            ? currentUser.displayName ?? DEFAULT_COMMUNITY_PROFILE.displayName
                            : communityProfile?.displayName ?? normalizedAuthorId,
                        avatarUrl: isCurrentUser
                            ? currentUser.avatarUrl ?? DEFAULT_COMMUNITY_PROFILE.avatarUrl
                            : communityProfile?.avatarUrl ?? buildFallbackAvatarUrl(normalizedAuthorId),
                        body: comment.body,
                        createdAt: comment.createdAt,
                        relativeTime: formatRelativeTime(comment.createdAt),
                        isOptimistic: Boolean(comment.optimistic),
                        transportStatus: (() => {
                            if (!comment.optimistic) {
                                return "success" as const;
                            }
                            const status = outboxStatusByTempId[comment.id];
                            if (status === statusTypes.failed) {
                                return "failed" as const;
                            }
                            return "pending" as const;
                        })(),
                    };
                })),
        [comments, outboxStatusByTempId, currentUser],
    );

    useEffect(() => {
        if (!targetId) return;
        if (loading === loadingStates.PENDING) return;

        const hasFetchedOnce = Boolean(lastFetchedAt);
        const lastFetchTime = lastFetchedAt ? Date.parse(lastFetchedAt) : 0;
        const isStale = Date.now() - lastFetchTime > staleAfterMs;

        if (!hasFetchedOnce) {
            dispatch(
                commentRetrieval({
                    targetId,
                    op: opTypes.RETRIEVE,
                    cursor: "",
                    limit: 10,
                }),
            );
            return;
        }

        if (isStale) {
            dispatch(
                commentRetrieval({
                    targetId,
                    op: opTypes.REFRESH,
                    cursor: "",
                    limit: 10,
                }),
            );
        }
    }, [dispatch, targetId, loading, lastFetchedAt, staleAfterMs]);

    const isLoading = loading === loadingStates.PENDING && viewModel.length === 0;
    const isRefreshing = loading === loadingStates.PENDING && viewModel.length > 0;

    return {
        comments: viewModel,
        isLoading,
        error,
        isRefreshing,
        uiViaHookCreateComment,
    } as const;
}
