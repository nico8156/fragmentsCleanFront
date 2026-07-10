import type { ImageRef } from "@/app/core-logic/contextWL/articleWl/typeAction/article.type";
import type { StudioArticleSubmitted, StudioCafeSummary } from "@/app/core-logic/contextWL/studioWl/gateway/studioWl.gateway";

export type StudioStatus = "idle" | "pending" | "success" | "error";

export type StudioStateWl = {
	articleSubmit: {
		status: StudioStatus;
		lastSubmitted?: StudioArticleSubmitted;
		commandStatus?: "PENDING" | "APPLIED" | "REJECTED";
		error?: string;
	};
	imageUpload: {
		status: StudioStatus;
		lastImage?: ImageRef;
		error?: string;
	};
	cafes: {
		status: StudioStatus;
		items: StudioCafeSummary[];
		error?: string;
	};
};
