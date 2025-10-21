import {createAction, createListenerMiddleware, TypedStartListening, nanoid} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {CommentEntity, moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";
import {commandKinds, OutboxItem} from "@/app/contextWL/outboxWl/type/outbox.type";

export const uiCommentCreateRequested = createAction<{ targetId: string, body: string, parentId?: string }>("UI/COMMENT/CREATE");
export const addOptimisticCreated = createAction<{entity:CommentEntity}>('UI/COMMENT/ADD_OPTIMISTIC_CREATED');
export const enqueueCommitted = createAction<{id: string; item: OutboxItem; enqueuedAt: string }>('UI/COMMENT/ENQUEUE_COMMITTED');
export const outboxProcessOnce = createAction("COMMENT/OUTBOXPROCESSONCE")

export const createCommentUseCaseFactory = (deps: DependenciesWl,callback?: () => void) => {
    const ccUseCase = createListenerMiddleware();
    const listener = ccUseCase.startListening as TypedStartListening<AppStateWl, AppDispatchWl>;

    listener({
        actionCreator: uiCommentCreateRequested,
        effect: async (action, api) => {
            const { targetId, body, parentId } = action.payload
            //creation du comment
            // 0) Garde-fous simples côté UI/effet
            const trimmed = body.trim();
            if (!trimmed || trimmed.length < 1) {
                if (callback) {
                    callback();
                }
                return
            }; // rien à faire
            const me = deps.helpers.currentUserId?.() ?? "me";
            const tempId = deps.helpers.getCommentIdForTests?.() ?? `cmt_tmp_${nanoid()}`;
            const outboxId = deps.helpers?.getCommandIdForTests?.() ?? `obx_${nanoid()}`;
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
            api.dispatch(enqueueCommitted({
                id: outboxId,
                item: {
                    command: { kind: commandKinds.CommentCreate, commandId, tempId, targetId, parentId, body: trimmed, at:createdAt },
                    undo: { kind: commandKinds.CommentCreate, tempId, targetId, parentId },
                },
                enqueuedAt,
            }))
            //dispatch du process de l'outbox !
            api.dispatch(outboxProcessOnce())
            if (callback) {
                callback();
            }
        }
    })
    return ccUseCase;
};