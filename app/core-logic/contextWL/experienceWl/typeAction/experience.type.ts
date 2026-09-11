import type { EntityState } from "@reduxjs/toolkit";

export type ExperienceStatus = "DRAFT" | "PUBLISHED" | "DELETED";
export type ExperienceModerationStatus = "VISIBLE" | "HIDDEN";
export type ExperienceReportReason = "HARASSMENT" | "HATE_SPEECH" | "SEXUAL_CONTENT" | "VIOLENCE" | "SPAM" | "FALSE_INFORMATION" | "OTHER";
export type LocalImageInput = { localUri: string; contentType: "image/jpeg" | "image/png"; size: number; width?: number; height?: number };
export type ExperienceMediaItem = { mediaId: string; url?: string; localUri?: string; width?: number; height?: number; position: number; uploadStatus?: "QUEUED" | "UPLOADING" };

export type ExperienceEntity = {
	experienceId: string;
	userId: string;
	coffeeId: string;
	authorName?: string;
	avatarUrl?: string | null;
	message: string;
	status: ExperienceStatus;
	moderationStatus: ExperienceModerationStatus;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string | null;
	version: number;
	optimistic?: boolean;
	media?: ExperienceMediaItem[];
};

export type ExperiencePage = { items: ExperienceEntity[]; nextCursor?: string | null };
export type ExperienceCollection = { ids: string[]; nextCursor?: string | null; loading: "IDLE" | "PENDING" | "SUCCESS" | "ERROR"; error?: string };
export type ExperienceStateWl = {
	entities: EntityState<ExperienceEntity, string>;
	byCoffee: Record<string, ExperienceCollection>;
	mine: ExperienceCollection;
	reportedIds: Record<string, true>;
};
