import { MyExperienceCard } from "../components/MyExperienceCard";
import { MyExperiencesReadState } from "../components/MyExperiencesReadState";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { pickDurableImage } from "@/app/adapters/secondary/gateways/media/pickDurableImage";
import { uiExperienceDeleteRequested, uiExperienceMediaAddRequested, uiExperienceMediaDeleteRequested, uiExperiencePublishRequested, uiExperienceUpdateRequested } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import type { ExperienceEntity } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";
import { myExperiencesRetrieval } from "@/app/core-logic/contextWL/experienceWl/usecases/read/experienceRetrieval";
import type { RootStateWl } from "@/app/store/reduxStoreWl";

export function MyExperiencesScreen() {
	const dispatch = useDispatch<any>();
	const state = useSelector((root: RootStateWl) => root.exState);
	const coffees = useSelector((root: RootStateWl) => root.cfState.byId) as Record<string, { name?: string }>;
	useEffect(() => { dispatch(myExperiencesRetrieval()); }, [dispatch]);
	const items = useMemo(
		() => state.mine.ids
			.map(id => state.entities.entities[id])
			.filter((item): item is ExperienceEntity => Boolean(item && item.status !== "DELETED")),
		[state.mine.ids, state.entities.entities],
	);

	return (
		<ProfileLayout refreshing={state.mine.loading === "PENDING"} onRefresh={() => dispatch(myExperiencesRetrieval())}>
			<View style={s.intro}>
				<Text style={s.introTitle}>Tes visites partagées</Text>
				<Text style={s.introText}>Retrouve ici tes publications et les brouillons que tu peux encore compléter.</Text>
			</View>
			<MyExperiencesReadState loading={state.mine.loading === "PENDING"} hasItems={items.length > 0}
				error={state.mine.error} onRetry={() => dispatch(myExperiencesRetrieval())} />
			{items.length > 0 ? (
				<View style={s.list}>
					{items.map(item => (
						<MyExperienceCard
							key={item.experienceId}
							item={item}
							coffeeName={coffees[item.coffeeId]?.name}
							onUpdate={(message) => dispatch(uiExperienceUpdateRequested({ experienceId: item.experienceId, message }))}
							onPublish={() => dispatch(uiExperiencePublishRequested({ experienceId: item.experienceId }))}
							onDelete={() => dispatch(uiExperienceDeleteRequested({ experienceId: item.experienceId }))}
							onAddPhoto={async () => {
								const photo = await pickDurableImage("library");
								if (photo) dispatch(uiExperienceMediaAddRequested({ experienceId: item.experienceId, photo }));
							}}
							onDeletePhoto={(mediaId) => dispatch(uiExperienceMediaDeleteRequested({ experienceId: item.experienceId, mediaId }))}
						/>
					))}
				</View>
			) : null}
		</ProfileLayout>
	);
}

const s = StyleSheet.create({
	intro: { gap: spacing.micro },
	introTitle: { ...typography.section, color: palette.textPrimary },
	introText: { ...typography.body, color: palette.textSecondary },
	list: { gap: spacing.standard },
});

export default MyExperiencesScreen;
