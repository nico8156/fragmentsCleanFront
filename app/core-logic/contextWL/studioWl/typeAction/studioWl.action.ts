import { createAction } from "@reduxjs/toolkit";
import type { ImageRef } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import type { StudioArticleSubmitted, StudioCafeSummary } from "@/app/core-logic/contextWL/studioWl/gateway/studioWl.gateway";

export const studioArticleSubmitRequested = createAction("STUDIO/ARTICLE_SUBMIT_REQUESTED");
export const studioArticleSubmitted = createAction<StudioArticleSubmitted>("STUDIO/ARTICLE_SUBMITTED");
export const studioArticleCommandAcknowledged = createAction<{ commandId: string; status: "APPLIED" | "REJECTED"; reason?: string }>("STUDIO/ARTICLE_COMMAND_ACKNOWLEDGED");
export const studioArticleSubmitFailed = createAction<{ error: string }>("STUDIO/ARTICLE_SUBMIT_FAILED");

export const studioArticleImageUploadRequested = createAction("STUDIO/ARTICLE_IMAGE_UPLOAD_REQUESTED");
export const studioArticleImageUploaded = createAction<ImageRef>("STUDIO/ARTICLE_IMAGE_UPLOADED");
export const studioArticleImageUploadFailed = createAction<{ error: string }>("STUDIO/ARTICLE_IMAGE_UPLOAD_FAILED");

export const studioCafesLoadRequested = createAction("STUDIO/CAFES_LOAD_REQUESTED");
export const studioCafesLoaded = createAction<{ cafes: StudioCafeSummary[] }>("STUDIO/CAFES_LOADED");
export const studioCafesLoadFailed = createAction<{ error: string }>("STUDIO/CAFES_LOAD_FAILED");
