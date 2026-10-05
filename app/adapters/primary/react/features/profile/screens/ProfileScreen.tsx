import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootScreenTitle } from "@/app/adapters/primary/react/components/design/RootScreenTitle";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { ProfileShortcuts } from "../components/ProfileShortcuts";

import {
	ProfileStackNavigationProp,
	ProfileStackParamList,
} from "@/app/adapters/primary/react/navigation/types";

import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";

type ProfileMenuDestination = Exclude<keyof ProfileStackParamList, "ProfileHome">;

export function ProfileScreen() {
	const navigation = useNavigation<ProfileStackNavigationProp>();
	const { displayName, avatarUrl, primaryEmail, profileMutationStatus, profileMutationError } = useAuthUser();
	const pass = usePassRingsViewModel();

	const handleNavigate = useCallback(
		(destination: ProfileMenuDestination) => {
			navigation.navigate(destination);
		},
		[navigation]
	);

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.root}>
		<ProfileLayout paddingTop={8}>
			<RootScreenTitle>Profil</RootScreenTitle>
			<ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail} rings={pass.displayRings}
				onEdit={() => handleNavigate("EditProfile")} syncing={profileMutationStatus === "pending"} error={profileMutationError} />
			<ProfileCard title="Mon carnet">
				<ProfileShortcuts onNavigate={handleNavigate} />
			</ProfileCard>
		</ProfileLayout>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: palette.background },
});

export default ProfileScreen;
