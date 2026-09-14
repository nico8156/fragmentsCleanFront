import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

export type MyExperienceCardViewModel = {
	coffeeName: string;
	statusLabel: "Brouillon" | "Synchronisation…" | "Publiée" | "Masquée";
	statusTone: "draft" | "pending" | "published" | "hidden";
	mediaUri?: string;
	mediaPending: boolean;
};

export const buildMyExperienceCardViewModel = (
	item: ExperienceEntity,
	coffeeName?: string,
): MyExperienceCardViewModel => {
	let statusLabel: MyExperienceCardViewModel["statusLabel"] = "Publiée";
	let statusTone: MyExperienceCardViewModel["statusTone"] = "published";
	if (item.moderationStatus === "HIDDEN") {
		statusLabel = "Masquée";
		statusTone = "hidden";
	} else if (item.optimistic) {
		statusLabel = "Synchronisation…";
		statusTone = "pending";
	} else if (item.status === "DRAFT") {
		statusLabel = "Brouillon";
		statusTone = "draft";
	}
	const media = item.media?.[0];
	return {
		coffeeName: coffeeName ?? "Café visité",
		statusLabel,
		statusTone,
		mediaUri: media?.url ?? media?.localUri,
		mediaPending: Boolean(media?.uploadStatus),
	};
};
