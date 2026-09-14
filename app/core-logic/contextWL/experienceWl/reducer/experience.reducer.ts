import { createEntityAdapter, createReducer } from "@reduxjs/toolkit";
import { readModelCacheRehydrated } from "../../appWl/typeAction/readModelCache.action";
import {
	coffeeExperiencesFailed, coffeeExperiencesPending, coffeeExperiencesReceived,
	experienceOptimisticCreated, experienceOptimisticDeleted, experienceOptimisticReported,
	experienceOptimisticUpdated, experienceReconciled, experienceRollback,
	experienceMediaOptimisticAdded, experienceMediaOptimisticDeleted,
	myExperiencesFailed, myExperiencesPending, myExperiencesReceived,
} from "../typeAction/experience.action";
import type { ExperienceCollection, ExperienceEntity, ExperienceStateWl } from "../typeAction/experience.type";

const adapter = createEntityAdapter<ExperienceEntity, string>({ selectId: item => item.experienceId, sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt) });
const emptyCollection = (): ExperienceCollection => ({ ids: [], loading: "IDLE" });
export const initialExperienceState: ExperienceStateWl = { entities: adapter.getInitialState(), byCoffee: {}, mine: emptyCollection(), reportedIds: {} };

const mergeServerPage = (state: ExperienceStateWl, current: ExperienceCollection, items: ExperienceEntity[], nextCursor?: string | null) => {
	const optimistic = current.ids.filter(id => state.entities.entities[id]?.optimistic);
	for (const item of items) {
		const local = state.entities.entities[item.experienceId];
		if (local && (local.version > item.version || (local.optimistic && local.version === item.version))) continue;
		// A create snapshot can precede the independently queued media attachment.
		const pendingMedia = (local?.media ?? []).filter(media => media.localUri && media.uploadStatus
			&& !(item.media ?? []).some(remote => remote.mediaId === media.mediaId && remote.url));
		adapter.upsertOne(state.entities, { ...item, media: [...(item.media ?? []), ...pendingMedia], optimistic: false });
	}
	current.ids = [...new Set([...optimistic, ...items.map(item => item.experienceId)])];
	current.nextCursor = nextCursor;
	current.loading = "SUCCESS";
	current.error = undefined;
};

export const experienceReducer = createReducer(initialExperienceState, builder => builder
	.addCase(readModelCacheRehydrated, (state, action) => action.payload.experiences ? { ...state, ...action.payload.experiences } : state)
	.addCase(coffeeExperiencesPending, (state, action) => { (state.byCoffee[action.payload.coffeeId] ??= emptyCollection()).loading = "PENDING"; })
	.addCase(coffeeExperiencesReceived, (state, action) => mergeServerPage(state, state.byCoffee[action.payload.coffeeId] ??= emptyCollection(), action.payload.page.items, action.payload.page.nextCursor))
	.addCase(coffeeExperiencesFailed, (state, action) => { const view = state.byCoffee[action.payload.coffeeId] ??= emptyCollection(); view.loading = "ERROR"; view.error = action.payload.error; })
	.addCase(myExperiencesPending, state => { state.mine.loading = "PENDING"; })
	.addCase(myExperiencesReceived, (state, action) => mergeServerPage(state, state.mine, action.payload.items, action.payload.nextCursor))
	.addCase(myExperiencesFailed, (state, action) => { state.mine.loading = "ERROR"; state.mine.error = action.payload.error; })
	.addCase(experienceOptimisticCreated, (state, action) => {
		const item = action.payload.entity;
		adapter.addOne(state.entities, item);
		const view = state.byCoffee[item.coffeeId] ??= emptyCollection();
		if (item.status === "PUBLISHED") view.ids.unshift(item.experienceId);
		state.mine.ids.unshift(item.experienceId);
	})
	.addCase(experienceOptimisticUpdated, (state, action) => { adapter.updateOne(state.entities, { id: action.payload.experienceId, changes: { ...(action.payload.message !== undefined ? { message: action.payload.message } : {}), ...(action.payload.status ? { status: action.payload.status, publishedAt: action.payload.at } : {}), updatedAt: action.payload.at, optimistic: true } }); })
	.addCase(experienceOptimisticDeleted, (state, action) => { adapter.updateOne(state.entities, { id: action.payload.experienceId, changes: { status: "DELETED", updatedAt: action.payload.at, optimistic: true } }); })
	.addCase(experienceOptimisticReported, (state, action) => { state.reportedIds[action.payload.experienceId] = true; })
	.addCase(experienceMediaOptimisticAdded, (state, action) => { const item=state.entities.entities[action.payload.experienceId];if(item)item.media=[...(item.media ?? []).filter(media=>media.mediaId!==action.payload.media.mediaId),action.payload.media]; })
	.addCase(experienceMediaOptimisticDeleted, (state, action) => { const item=state.entities.entities[action.payload.experienceId];if(item)item.media=(item.media ?? []).filter(media=>media.mediaId!==action.payload.mediaId); })
	.addCase(experienceRollback, (state, action) => {
		if (action.payload.reported) {
			delete state.reportedIds[action.payload.experienceId];
			return;
		}
		if (action.payload.previous) adapter.upsertOne(state.entities, action.payload.previous);
		else {
			adapter.removeOne(state.entities, action.payload.experienceId);
			for (const view of Object.values(state.byCoffee)) view.ids = view.ids.filter(id => id !== action.payload.experienceId);
			state.mine.ids = state.mine.ids.filter(id => id !== action.payload.experienceId);
		}
	})
	.addCase(experienceReconciled, (state, action) => { adapter.updateOne(state.entities, { id: action.payload.experienceId, changes: { optimistic: false } }); })
);
