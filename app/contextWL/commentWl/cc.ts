import {createAction, createListenerMiddleware, TypedStartListening, nanoid} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {CommentEntity, moderationTypes} from "@/app/contextWL/commentWl/commentWl.type";
import {commandKinds, OutboxItem} from "@/app/contextWL/outboxWl/outbox.type";

export const ccAction = createAction<{ targetId: string, body: string, parentId?: string }>("UI/COMMENT/CREATE");
export const addOptimisticCreated = createAction<{entity:CommentEntity}>('UI/COMMENT/ADD_OPTIMISTIC_CREATED');
export const enqueueCommited = createAction<{id: string; item: OutboxItem; enqueuedAt: string }>('UI/COMMENT/ENQUEUE_COMMITED');

export const createCommentUseCaseFactory = (deps: DependenciesWl,callback?: () => void) => {
    const ccUseCase = createListenerMiddleware();
    const listener = ccUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator: ccAction,
        effect: async (action, api) => {
            const { targetId, body, parentId } = action.payload
            //creation du comment
            // 0) Garde-fous simples côté UI/effet
            const trimmed = body.trim();
            if (!trimmed) return; // rien à faire
            const me = deps.helpers.currentUserId?.() ?? "me";
            //const tempId = `cmt_tmp_${nanoid()}`;
            const tempId = deps.helpers.getCommentIdForTests()
            //const outboxId = `obx_${nanoid()}`;
            const outboxId = deps.helpers.getCommandIdForTests()
            const commandId = `cmd_${nanoid()}`;
            const createdAt = deps.helpers.nowIso ? deps.helpers.nowIso() : new Date().toISOString();
            const enqueuedAt = createdAt;

            api.dispatch(addOptimisticCreated({
                    entity: {
                        id: tempId,
                        targetId,
                        parentId,
                        body: trimmed,
                        authorId: me,
                        createdAt,
                        likeCount: 0,
                        replyCount: 0,
                        moderation: moderationTypes.PUBLISHED,
                        version: 0,
                        optimistic: true,
                    }
                })
            )
            //creation de la command
            api.dispatch(enqueueCommited({
                id: outboxId,
                item: {
                    command: { kind: commandKinds.CommentCreate, commandId, tempId, targetId, parentId, body: trimmed, createdAt },
                    undo: { kind: commandKinds.CommentCreate, tempId, targetId, parentId },
                },
                enqueuedAt,
            }))

            if (callback) {
                callback();
            }
            //
            // const tempId = deps.ids.newId();
            // const now = deps.clock.nowISO();
            // const authorId = deps.selectCurrentUserId(api.getState().comments as CommentsState);
            //
            // api.dispatch(commentCreateOptimisticApplied({
            //     tempId,
            //     postId: action.payload.postId,
            //     authorId,
            //     body: action.payload.body, createdAt: now, updatedAt: now,
            //     status: CommentStatuss.CommentVisible,
            //     _local: { sync: LocalSyncStates.Pending, version: 1 }
            // } as Comment));

            // // 2) Outbox enqueue
            // const cmd: CommentCreateCmd = {
            //     type: CommentCommandTypes.CommentCreate,
            //     commandId: deps.ids.newId(),
            //     createdAt: now,
            //     attempt: 0,
            //     tempId,
            //     postId: action.payload.postId,
            //     body: action.payload.body,
            // };
            // api.dispatch(enqueue(cmd));
            // api.dispatch(startCommentCreateProcessing())
            // callback?.();
            // await processOutboxOnce(deps, api);
        },
    })
    return ccUseCase;
};