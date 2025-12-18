import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";
import {createAction, createListenerMiddleware, TypedStartListening, nanoid} from "@reduxjs/toolkit";
import {AppStateWl, DependenciesWl} from "@/app/store/appStateWl";
import {AppDispatchWl} from "@/app/store/reduxStoreWl";
import {CommentEntity, moderationTypes} from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import {commandKinds, OutboxItem} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.type";
import {outboxProcessOnce} from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

export const uiCommentCreateRequested = createAction<{ targetId: string, body: string, parentId?: string }>("UI/COMMENT/CREATE");
export const addOptimisticCreated = createAction<{entity:CommentEntity}>('UI/COMMENT/ADD_OPTIMISTIC_CREATED');
export const enqueueCommitted = createAction<{id: string; item: OutboxItem; enqueuedAt: string }>('UI/COMMENT/ENQUEUE_COMMITTED');


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
            console.log("[commentCreateRequested] / / current user : ",deps.helpers.currentUserId?.())
            const me = deps.helpers.currentUserId?.() ?? "anonymous";
            if (me === "anonymous") return;

            const meProfile = deps.helpers.currentUserProfile();

            const authorName = meProfile?.displayName ?? "Moi";
            const avatarUrl = meProfile?.avatarUrl ?? undefined;
            console.log("authorName from usecase",authorName)
            console.log("avatarUrl from usecase",avatarUrl)

            const tempId =
                deps.helpers.getCommentIdForTests?.() ??
                uuidv4(); // ✅ tempId MUST be UUID if backend does UUID.fromString(tempId)

            const outboxId =
                deps.helpers?.getCommandIdForTests?.() ??
                `obx_${nanoid()}`; // ✅ interne outbox, nanoid OK

            const commandId = deps.helpers.newCommandId?.() ?? (uuidv4() as any);
            // ✅ corrélation front/back, UUID v4 (pas cmd_...)
            const createdAt = deps.helpers.nowIso ? deps.helpers.nowIso() : new Date().toISOString();
            const enqueuedAt = createdAt;

            api.dispatch(addOptimisticCreated({
                    entity: {
                        id: tempId,
                        targetId,
                        parentId,
                        body: trimmed,
                        authorId: me,
                        authorName,
                        avatarUrl,
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
                    undo: { kind: commandKinds.CommentCreate, commentId: tempId, targetId, parentId },
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