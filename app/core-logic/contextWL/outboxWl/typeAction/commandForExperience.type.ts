import type { ExperienceEntity, ExperienceReportReason, LocalImageInput } from "../../experienceWl/typeAction/experience.type";
import { commandKinds } from "./outbox.type";

type Base = { commandId: string; experienceId: string; at: string };
export type ExperienceCreateCommand = Base & { kind: typeof commandKinds.ExperienceCreate; coffeeId: string; message: string; publicationStatus: "DRAFT" | "PUBLISHED" };
export type ExperienceUpdateCommand = Base & { kind: typeof commandKinds.ExperienceUpdate; message: string };
export type ExperiencePublishCommand = Base & { kind: typeof commandKinds.ExperiencePublish };
export type ExperienceDeleteCommand = Base & { kind: typeof commandKinds.ExperienceDelete };
export type ExperienceReportCommand = Base & { kind: typeof commandKinds.ExperienceReport; reportId: string; reason: ExperienceReportReason; details?: string };
export type ExperienceMediaAttachCommand = Base & { kind: typeof commandKinds.ExperienceMediaAttach; mediaId: string; image: LocalImageInput };
export type ExperienceMediaDeleteCommand = Base & { kind: typeof commandKinds.ExperienceMediaDelete; mediaId: string };
export type ExperienceUndo = { kind: typeof commandKinds.ExperienceCreate | typeof commandKinds.ExperienceUpdate | typeof commandKinds.ExperiencePublish | typeof commandKinds.ExperienceDelete | typeof commandKinds.ExperienceReport | typeof commandKinds.ExperienceMediaAttach | typeof commandKinds.ExperienceMediaDelete; experienceId: string; previous?: ExperienceEntity; reported?: boolean };
