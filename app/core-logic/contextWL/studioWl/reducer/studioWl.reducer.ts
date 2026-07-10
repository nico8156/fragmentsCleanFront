import { createReducer } from "@reduxjs/toolkit";
import {
	studioArticleCommandAcknowledged,
	studioArticleImageUploadFailed,
	studioArticleImageUploaded,
	studioArticleImageUploadRequested,
	studioArticleSubmitFailed,
	studioArticleSubmitRequested,
	studioArticleSubmitted,
	studioCafesLoaded,
	studioCafesLoadFailed,
	studioCafesLoadRequested,
} from "@/app/core-logic/contextWL/studioWl/typeAction/studioWl.action";
import type { StudioStateWl } from "@/app/core-logic/contextWL/studioWl/typeAction/studioWl.type";

const initialState: StudioStateWl = {
	articleSubmit: { status: "idle" },
	imageUpload: { status: "idle" },
	cafes: { status: "idle", items: [] },
};

export const studioWlReducer = createReducer(initialState, (builder) => {
	builder
		.addCase(studioArticleSubmitRequested, (state) => {
			state.articleSubmit.status = "pending";
			state.articleSubmit.commandStatus = undefined;
			state.articleSubmit.error = undefined;
		})
		.addCase(studioArticleSubmitted, (state, { payload }) => {
			state.articleSubmit.status = "success";
			state.articleSubmit.lastSubmitted = payload;
			state.articleSubmit.commandStatus = "PENDING";
		})
		.addCase(studioArticleCommandAcknowledged, (state, { payload }) => {
			state.articleSubmit.commandStatus = payload.status;
			if (payload.status === "REJECTED") {
				state.articleSubmit.status = "error";
				state.articleSubmit.error = payload.reason ?? "article command rejected";
			}
		})
		.addCase(studioArticleSubmitFailed, (state, { payload }) => {
			state.articleSubmit.status = "error";
			state.articleSubmit.error = payload.error;
		})
		.addCase(studioArticleImageUploadRequested, (state) => {
			state.imageUpload.status = "pending";
			state.imageUpload.error = undefined;
		})
		.addCase(studioArticleImageUploaded, (state, { payload }) => {
			state.imageUpload.status = "success";
			state.imageUpload.lastImage = payload;
		})
		.addCase(studioArticleImageUploadFailed, (state, { payload }) => {
			state.imageUpload.status = "error";
			state.imageUpload.error = payload.error;
		})
		.addCase(studioCafesLoadRequested, (state) => {
			state.cafes.status = "pending";
			state.cafes.error = undefined;
		})
		.addCase(studioCafesLoaded, (state, { payload }) => {
			state.cafes.status = "success";
			state.cafes.items = payload.cafes;
		})
		.addCase(studioCafesLoadFailed, (state, { payload }) => {
			state.cafes.status = "error";
			state.cafes.error = payload.error;
		});
});
