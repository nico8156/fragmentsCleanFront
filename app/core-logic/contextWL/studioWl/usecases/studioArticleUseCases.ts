import type { AppThunkWl } from "@/app/store/reduxStoreWl";
import type { StudioArticleDraft, StudioImageUpload } from "@/app/core-logic/contextWL/studioWl/gateway/studioWl.gateway";
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const submitStudioArticle =
	(input: { draft: StudioArticleDraft; adminToken: string }): AppThunkWl<Promise<void>> =>
	async (dispatch, _getState, gateways) => {
		dispatch(studioArticleSubmitRequested());
		try {
			const studio = gateways?.studio;
			if (!studio) throw new Error("studio gateway unavailable");
			const submitted = await studio.submitArticle(input);
			dispatch(studioArticleSubmitted(submitted));

			const commandStatus = gateways?.commandStatus;
			if (!commandStatus) return;
			for (let attempt = 0; attempt < 4; attempt += 1) {
				await wait(attempt === 0 ? 250 : 750);
				const status = await commandStatus.getStatus(submitted.commandId);
				if (status.status === "APPLIED") {
					dispatch(studioArticleCommandAcknowledged({ commandId: submitted.commandId, status: "APPLIED" }));
					return;
				}
				if (status.status === "REJECTED") {
					dispatch(studioArticleCommandAcknowledged({ commandId: submitted.commandId, status: "REJECTED", reason: status.reason }));
					return;
				}
			}
		} catch (error: any) {
			dispatch(studioArticleSubmitFailed({ error: error?.message ?? "article submit failed" }));
		}
	};

export const uploadStudioArticleImage =
	(input: StudioImageUpload): AppThunkWl<Promise<void>> =>
	async (dispatch, _getState, gateways) => {
		dispatch(studioArticleImageUploadRequested());
		try {
			const studio = gateways?.studio;
			if (!studio) throw new Error("studio gateway unavailable");
			const image = await studio.uploadArticleImage(input);
			dispatch(studioArticleImageUploaded(image));
		} catch (error: any) {
			dispatch(studioArticleImageUploadFailed({ error: error?.message ?? "article image upload failed" }));
		}
	};

export const loadStudioCafes =
	(input: { adminToken: string }): AppThunkWl<Promise<void>> =>
	async (dispatch, _getState, gateways) => {
		dispatch(studioCafesLoadRequested());
		try {
			const studio = gateways?.studio;
			if (!studio) throw new Error("studio gateway unavailable");
			const cafes = await studio.listCafes(input);
			dispatch(studioCafesLoaded({ cafes }));
		} catch (error: any) {
			dispatch(studioCafesLoadFailed({ error: error?.message ?? "cafes load failed" }));
		}
	};
