import type { ExperienceEntity, ExperienceReportReason } from "../../experienceWl/typeAction/experience.type";
import { commandKinds } from "./outbox.type";

type Base = { commandId: string; experienceId: string; at: string };
export type ExperienceCreateCommand = Base & { kind: typeof commandKinds.ExperienceCreate; coffeeId: string; message: string; publicationStatus: "DRAFT" | "PUBLISHED" };
export type ExperienceUpdateCommand = Base & { kind: typeof commandKinds.ExperienceUpdate; message: string };
export type ExperiencePublishCommand = Base & { kind: typeof commandKinds.ExperiencePublish };
export type ExperienceDeleteCommand = Base & { kind: typeof commandKinds.ExperienceDelete };
export type ExperienceReportCommand = Base & { kind: typeof commandKinds.ExperienceReport; reportId: string; reason: ExperienceReportReason; details?: string };
export type ExperienceUndo = { kind: typeof commandKinds.ExperienceCreate | typeof commandKinds.ExperienceUpdate | typeof commandKinds.ExperiencePublish | typeof commandKinds.ExperienceDelete | typeof commandKinds.ExperienceReport; experienceId: string; previous?: ExperienceEntity; reported?: boolean };
