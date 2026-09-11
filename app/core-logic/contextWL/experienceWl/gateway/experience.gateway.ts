import type { ExperiencePage, ExperienceReportReason, LocalImageInput } from "../typeAction/experience.type";

export interface ExperienceGateway {
	listCoffee(input: { coffeeId: string; cursor?: string; limit?: number; signal: AbortSignal }): Promise<ExperiencePage>;
	listMine(input: { cursor?: string; limit?: number; signal: AbortSignal }): Promise<ExperiencePage>;
	create(input: { commandId: string; experienceId: string; coffeeId: string; message: string; publicationStatus: "DRAFT" | "PUBLISHED"; at: string }): Promise<void>;
	update(input: { commandId: string; experienceId: string; message: string; at: string }): Promise<void>;
	publish(input: { commandId: string; experienceId: string; at: string }): Promise<void>;
	delete(input: { commandId: string; experienceId: string; at: string }): Promise<void>;
	report(input: { commandId: string; reportId: string; experienceId: string; reason: ExperienceReportReason; details?: string; at: string }): Promise<void>;
	uploadMedia(input: { commandId: string; mediaId: string; experienceId: string; image: LocalImageInput; at: string }): Promise<void>;
	deleteMedia(input: { commandId: string; mediaId: string; experienceId: string; at: string }): Promise<void>;
}
