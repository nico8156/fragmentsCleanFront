import { createSelector } from "@reduxjs/toolkit";

import {
	CafeId,
	CommentEntity,
	LoadingState,
	loadingStates,
	moderationTypes,
} from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";
import { RootStateWl } from "@/app/store/reduxStoreWl";

type CommentsSlice = RootStateWl["cState"];

type CommentsSelectorResult = {
	comments: CommentEntity[];
	loading: LoadingState;
	error?: string;
	lastFetchedAt?: string;
	staleAfterMs: number;
};

const DEFAULT_STALE_AFTER_MS = 30_000;

const selectCommentsState = (state: RootStateWl): CommentsSlice => state.cState;

export const selectAllComments = (state: RootStateWl) => state.cState.entities.entities;

export const selectCommentsForTarget = (targetId: CafeId) =>
	createSelector(
		[
			(state: RootStateWl) => selectCommentsState(state).entities.entities,
			(state: RootStateWl) => selectCommentsState(state).byTarget[targetId],
		],
		(entities, view): CommentsSelectorResult => {
			if (!view) {
				return {
					comments: [],
					loading: loadingStates.IDLE,
					error: undefined,
					lastFetchedAt: undefined,
					staleAfterMs: DEFAULT_STALE_AFTER_MS,
				};
			}

			const comments = (view.ids ?? [])
				.map((id) => entities[id])
				.filter((c): c is CommentEntity => Boolean(c))
				.filter((c) => !c.deletedAt && c.moderation !== moderationTypes.SOFT_DELETED);

			return {
				comments,
				loading: view.loading,
				error: view.error,
				lastFetchedAt: view.lastFetchedAt,
				staleAfterMs: view.staleAfterMs ?? DEFAULT_STALE_AFTER_MS,
			};
		},
	);
