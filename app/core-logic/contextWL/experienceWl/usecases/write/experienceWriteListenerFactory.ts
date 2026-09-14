import { nanoid, type TypedStartListening } from "@reduxjs/toolkit";
import { createListenerMiddleware as createAccountScopedListener } from "../../../appWl/runtime/accountScope";
import { enqueueCommitted, outboxProcessOnce } from "../../../outboxWl/typeAction/outbox.actions";
import { commandKinds } from "../../../outboxWl/typeAction/outbox.type";
import type { DependenciesWl } from "@/app/store/appStateWl";
import type { AppDispatchWl, RootStateWl } from "@/app/store/reduxStoreWl";
import {
	experienceOptimisticCreated, experienceOptimisticDeleted, experienceOptimisticReported,
	experienceOptimisticUpdated, uiExperienceCreateRequested, uiExperienceDeleteRequested,
	uiExperiencePublishRequested, uiExperienceReportRequested, uiExperienceUpdateRequested,
	experienceMediaOptimisticAdded, experienceMediaOptimisticDeleted,
	uiExperienceMediaAddRequested, uiExperienceMediaDeleteRequested,
	coffeeExperiencesReceived, myExperiencesReceived,
} from "../../typeAction/experience.action";
import type { ExperienceEntity } from "../../typeAction/experience.type";
import { isLocalPrivateMediaReferenced } from "@/app/core-logic/contextWL/outboxWl/selector/outboxSelectors";

const outboxId = () => `obx_${nanoid()}`;

export const experienceWriteListenerFactory = (deps: DependenciesWl) => {
	const middleware = createAccountScopedListener();
	const listen = middleware.startListening as TypedStartListening<RootStateWl, AppDispatchWl>;
	const enqueue = (api: any, command: any, undo: any, at: string) => {
		api.dispatch(enqueueCommitted({ id: outboxId(), item: { command, undo }, enqueuedAt: at }));
		api.dispatch(outboxProcessOnce());
	};

	listen({ actionCreator: uiExperienceCreateRequested, effect: async (action, api) => {
		const message = action.payload.message.trim(); if (!message) return;
		const userId = deps.helpers.currentUserId?.(); if (!userId) return;
		const at = deps.helpers.nowIso(); const experienceId = String(deps.helpers.newCommandId());
		const profile = deps.helpers.currentUserProfile(); const requestedStatus = action.payload.draft ? "DRAFT" : "PUBLISHED"; const initialStatus = action.payload.photo ? "DRAFT" : requestedStatus;
		const mediaId = action.payload.photo ? String(deps.helpers.newCommandId()) : undefined;
		const optimisticMedia = action.payload.photo && mediaId ? [{ mediaId, localUri: action.payload.photo.localUri, width: action.payload.photo.width, height: action.payload.photo.height, position: 0, uploadStatus: "QUEUED" as const }] : [];
		const optimisticEntity: ExperienceEntity = { experienceId, userId, coffeeId: action.payload.coffeeId, authorName: profile?.displayName ?? "Moi", avatarUrl: profile?.avatarUrl, message, status: requestedStatus, moderationStatus: "VISIBLE", createdAt: at, updatedAt: at, publishedAt: requestedStatus === "PUBLISHED" ? at : null, version: 0, optimistic: true, media: optimisticMedia };
		api.dispatch(experienceOptimisticCreated({ entity: optimisticEntity }));
		enqueue(api, { kind: commandKinds.ExperienceCreate, commandId: deps.helpers.newCommandId(), experienceId, coffeeId: action.payload.coffeeId, message, publicationStatus: initialStatus, at }, { kind: commandKinds.ExperienceCreate, experienceId }, at);
		if(action.payload.photo&&mediaId){const withoutMedia={...optimisticEntity,media:[]};enqueue(api,{kind:commandKinds.ExperienceMediaAttach,commandId:deps.helpers.newCommandId(),experienceId,mediaId,image:action.payload.photo,at},{kind:commandKinds.ExperienceMediaAttach,experienceId,previous:withoutMedia},at);if(!action.payload.draft)enqueue(api,{kind:commandKinds.ExperiencePublish,commandId:deps.helpers.newCommandId(),experienceId,at},{kind:commandKinds.ExperiencePublish,experienceId,previous:{...optimisticEntity,status:"DRAFT",publishedAt:null}},at);}
	} });

	listen({ actionCreator: uiExperienceUpdateRequested, effect: async (action, api) => {
		const message = action.payload.message.trim(); if (!message) return;
		const previous = api.getState().exState.entities.entities[action.payload.experienceId]; if (!previous) return;
		const at = deps.helpers.nowIso(); api.dispatch(experienceOptimisticUpdated({ experienceId: action.payload.experienceId, message, at }));
		enqueue(api, { kind: commandKinds.ExperienceUpdate, commandId: deps.helpers.newCommandId(), experienceId: action.payload.experienceId, message, at }, { kind: commandKinds.ExperienceUpdate, experienceId: action.payload.experienceId, previous }, at);
	} });

	listen({ actionCreator: uiExperiencePublishRequested, effect: async (action, api) => {
		const previous = api.getState().exState.entities.entities[action.payload.experienceId]; if (!previous) return;
		const at = deps.helpers.nowIso(); api.dispatch(experienceOptimisticUpdated({ experienceId: action.payload.experienceId, status: "PUBLISHED", at }));
		enqueue(api, { kind: commandKinds.ExperiencePublish, commandId: deps.helpers.newCommandId(), experienceId: action.payload.experienceId, at }, { kind: commandKinds.ExperiencePublish, experienceId: action.payload.experienceId, previous }, at);
	} });

	listen({ actionCreator: uiExperienceDeleteRequested, effect: async (action, api) => {
		const previous = api.getState().exState.entities.entities[action.payload.experienceId]; if (!previous) return;
		const at = deps.helpers.nowIso(); api.dispatch(experienceOptimisticDeleted({ experienceId: action.payload.experienceId, at }));
		enqueue(api, { kind: commandKinds.ExperienceDelete, commandId: deps.helpers.newCommandId(), experienceId: action.payload.experienceId, at }, { kind: commandKinds.ExperienceDelete, experienceId: action.payload.experienceId, previous }, at);
	} });

	listen({ actionCreator: uiExperienceReportRequested, effect: async (action, api) => {
		const at = deps.helpers.nowIso(); const reportId = String(deps.helpers.newCommandId());
		api.dispatch(experienceOptimisticReported({ experienceId: action.payload.experienceId }));
		enqueue(api, { kind: commandKinds.ExperienceReport, commandId: deps.helpers.newCommandId(), reportId, experienceId: action.payload.experienceId, reason: action.payload.reason, details: action.payload.details, at }, { kind: commandKinds.ExperienceReport, experienceId: action.payload.experienceId, reported: true }, at);
	} });

	listen({actionCreator:uiExperienceMediaAddRequested,effect:async(action,api)=>{const previous=api.getState().exState.entities.entities[action.payload.experienceId];if(!previous||(previous.media?.length ?? 0)>0)return;const at=deps.helpers.nowIso();const mediaId=String(deps.helpers.newCommandId());api.dispatch(experienceMediaOptimisticAdded({experienceId:action.payload.experienceId,media:{mediaId,localUri:action.payload.photo.localUri,width:action.payload.photo.width,height:action.payload.photo.height,position:0,uploadStatus:"QUEUED"}}));enqueue(api,{kind:commandKinds.ExperienceMediaAttach,commandId:deps.helpers.newCommandId(),experienceId:action.payload.experienceId,mediaId,image:action.payload.photo,at},{kind:commandKinds.ExperienceMediaAttach,experienceId:action.payload.experienceId,previous},at);}});

	listen({actionCreator:uiExperienceMediaDeleteRequested,effect:async(action,api)=>{const previous=api.getState().exState.entities.entities[action.payload.experienceId];if(!previous)return;const at=deps.helpers.nowIso();api.dispatch(experienceMediaOptimisticDeleted(action.payload));enqueue(api,{kind:commandKinds.ExperienceMediaDelete,commandId:deps.helpers.newCommandId(),experienceId:action.payload.experienceId,mediaId:action.payload.mediaId,at},{kind:commandKinds.ExperienceMediaDelete,experienceId:action.payload.experienceId,previous},at);}});

	const discardReconciledMedia = (items: ExperienceEntity[], api: { getOriginalState: () => RootStateWl; getState: () => RootStateWl }) => {
		const before = api.getOriginalState();
		const after = api.getState();
		for (const serverItem of items) {
			const localMedia = before.exState.entities.entities[serverItem.experienceId]?.media ?? [];
			for (const local of localMedia) {
				if (!local.localUri) continue;
				const remote = serverItem.media?.find(item => item.mediaId === local.mediaId);
				if (!remote?.url || isLocalPrivateMediaReferenced(after, local.localUri)) continue;
				deps.gateways.localPrivateMedia?.discard(local.localUri);
			}
		}
	};

	listen({ actionCreator: myExperiencesReceived, effect: (action, api) => discardReconciledMedia(action.payload.items, api) });
	listen({ actionCreator: coffeeExperiencesReceived, effect: (action, api) => discardReconciledMedia(action.payload.page.items, api) });

	return middleware;
};
