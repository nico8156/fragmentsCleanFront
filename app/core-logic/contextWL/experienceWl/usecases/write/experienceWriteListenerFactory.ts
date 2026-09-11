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
} from "../../typeAction/experience.action";

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
		const profile = deps.helpers.currentUserProfile(); const status = action.payload.draft ? "DRAFT" : "PUBLISHED";
		api.dispatch(experienceOptimisticCreated({ entity: { experienceId, userId, coffeeId: action.payload.coffeeId, authorName: profile?.displayName ?? "Moi", avatarUrl: profile?.avatarUrl, message, status, moderationStatus: "VISIBLE", createdAt: at, updatedAt: at, publishedAt: status === "PUBLISHED" ? at : null, version: 0, optimistic: true } }));
		enqueue(api, { kind: commandKinds.ExperienceCreate, commandId: deps.helpers.newCommandId(), experienceId, coffeeId: action.payload.coffeeId, message, publicationStatus: status, at }, { kind: commandKinds.ExperienceCreate, experienceId }, at);
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

	return middleware;
};
