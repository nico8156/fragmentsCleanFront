import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { selectCurrentUser, selectEffectiveUserId } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import { uiUserBlockRequested } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentModerationWlUseCase";
import { uiExperienceCreateRequested, uiExperienceDeleteRequested, uiExperienceMediaAddRequested, uiExperienceMediaDeleteRequested, uiExperienceReportRequested, uiExperienceUpdateRequested } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import type { ExperienceReportReason, LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { coffeeExperiencesRetrieval } from "@/app/core-logic/contextWL/experienceWl/usecases/read/experienceRetrieval";
import { withCurrentUserExperienceIdentity } from "@/app/adapters/secondary/viewModel/experienceIdentityViewModel";

export function useExperiencesForCafe(coffeeId?: string) {
	const dispatch = useDispatch<any>();
	const me = useSelector(selectEffectiveUserId);
	const currentUser = useSelector(selectCurrentUser);
	const slice = useSelector((state: RootStateWl) => coffeeId ? state.exState.byCoffee[coffeeId] : undefined);
	const entities = useSelector((state: RootStateWl) => state.exState.entities.entities);
	const reported = useSelector((state: RootStateWl) => state.exState.reportedIds);
	const blockedUsers = useSelector((state: RootStateWl) => state.cState.blockedUsers);
	useEffect(() => { if (coffeeId) dispatch(coffeeExperiencesRetrieval({ coffeeId })); }, [coffeeId, dispatch]);
	const experiences = useMemo(() => (slice?.ids ?? [])
		.map(id => entities[id])
		.filter(item => item && item.status === "PUBLISHED" && item.moderationStatus === "VISIBLE" && !reported[item.experienceId] && !blockedUsers[item.userId])
		.map(item => ({ ...withCurrentUserExperienceIdentity(item, me, currentUser), isAuthor: String(item.userId) === String(me) })),
	[slice?.ids, entities, reported, blockedUsers, me, currentUser]);
	return {
		experiences,
		isLoading: slice?.loading === "PENDING" && !slice.ids.length,
		error: slice?.error,
		refresh: () => coffeeId && dispatch(coffeeExperiencesRetrieval({ coffeeId })),
		create: (message: string, draft = false, photo?: LocalImageInput) => coffeeId && dispatch(uiExperienceCreateRequested({ coffeeId, message, draft, photo })),
		addPhoto: (experienceId: string, photo: LocalImageInput) => dispatch(uiExperienceMediaAddRequested({ experienceId, photo })),
		deletePhoto: (experienceId: string, mediaId: string) => dispatch(uiExperienceMediaDeleteRequested({ experienceId, mediaId })),
		update: (experienceId: string, message: string) => dispatch(uiExperienceUpdateRequested({ experienceId, message })),
		remove: (experienceId: string) => dispatch(uiExperienceDeleteRequested({ experienceId })),
		report: (experienceId: string, reason: ExperienceReportReason) => dispatch(uiExperienceReportRequested({ experienceId, reason })),
		block: (userId: string, displayName?: string, avatarUrl?: string | null) => dispatch(uiUserBlockRequested({ userId, displayName, avatarUrl: avatarUrl ?? undefined })),
	};
}
