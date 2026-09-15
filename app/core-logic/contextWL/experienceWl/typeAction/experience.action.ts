import { createAction } from "@reduxjs/toolkit";
import type { ExperienceEntity, ExperienceMediaItem, ExperiencePage, ExperienceReportReason, LocalImageInput } from "./experience.type";

export const coffeeExperiencesPending = createAction<{ coffeeId: string }>("EXPERIENCE/COFFEE/PENDING");
export const coffeeExperiencesReceived = createAction<{ coffeeId: string; page: ExperiencePage }>("EXPERIENCE/COFFEE/RECEIVED");
export const coffeeExperiencesFailed = createAction<{ coffeeId: string; error: string }>("EXPERIENCE/COFFEE/FAILED");
export const myExperiencesPending = createAction("EXPERIENCE/MINE/PENDING");
export const myExperiencesReceived = createAction<ExperiencePage>("EXPERIENCE/MINE/RECEIVED");
export const myExperiencesFailed = createAction<{ error: string }>("EXPERIENCE/MINE/FAILED");

export const uiExperienceCreateRequested = createAction<{ coffeeId: string; message: string; draft?: boolean; photo?: LocalImageInput }>("UI/EXPERIENCE/CREATE");
export const uiExperienceUpdateRequested = createAction<{ experienceId: string; message: string }>("UI/EXPERIENCE/UPDATE");
export const uiExperiencePublishRequested = createAction<{ experienceId: string }>("UI/EXPERIENCE/PUBLISH");
export const uiExperienceDeleteRequested = createAction<{ experienceId: string }>("UI/EXPERIENCE/DELETE");
export const uiExperienceReportRequested = createAction<{ experienceId: string; reason: ExperienceReportReason; details?: string }>("UI/EXPERIENCE/REPORT");
export const uiExperienceMediaAddRequested = createAction<{ experienceId: string; photo: LocalImageInput }>("UI/EXPERIENCE/MEDIA_ADD");
export const uiExperienceMediaDeleteRequested = createAction<{ experienceId: string; mediaId: string }>("UI/EXPERIENCE/MEDIA_DELETE");

export const experienceOptimisticCreated = createAction<{ entity: ExperienceEntity }>("EXPERIENCE/OPTIMISTIC/CREATED");
export const experienceOptimisticUpdated = createAction<{ experienceId: string; message?: string; status?: "PUBLISHED"; at: string }>("EXPERIENCE/OPTIMISTIC/UPDATED");
export const experienceOptimisticDeleted = createAction<{ experienceId: string; at: string }>("EXPERIENCE/OPTIMISTIC/DELETED");
export const experienceOptimisticReported = createAction<{ experienceId: string }>("EXPERIENCE/OPTIMISTIC/REPORTED");
export const experienceMediaOptimisticAdded = createAction<{ experienceId: string; media: ExperienceMediaItem }>("EXPERIENCE/MEDIA/OPTIMISTIC_ADDED");
export const experienceMediaOptimisticDeleted = createAction<{ experienceId: string; mediaId: string }>("EXPERIENCE/MEDIA/OPTIMISTIC_DELETED");
export const experienceRollback = createAction<{ previous?: ExperienceEntity; experienceId: string; reported?: boolean; preserveDeletion?: boolean }>("EXPERIENCE/ROLLBACK");
export const experienceReconciled = createAction<{ experienceId: string }>("EXPERIENCE/RECONCILED");
