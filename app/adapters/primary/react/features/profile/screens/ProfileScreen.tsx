import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";

import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import {
	ProfileMenuItem,
	ProfileMenuList,
} from "@/app/adapters/primary/react/features/profile/components/ProfileMenuList";

import {
	ProfileStackNavigationProp,
	ProfileStackParamList,
} from "@/app/adapters/primary/react/navigation/types";

import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { usePassRingsViewModel } from "@/app/adapters/secondary/viewModel/usePassRingsViewModel";

type ProfileMenuDestination = Exclude<keyof ProfileStackParamList, "ProfileHome">;

const MENU_ITEMS: ProfileMenuItem<ProfileMenuDestination>[] = [
	{ symbolName: "pencil", title: "Modifier mon profil", destination: "EditProfile" },
	{ symbolName: "list.bullet.rectangle.portrait", title: "Mes tickets", destination: "Tickets" },
	{ symbolName: "heart.fill", title: "Mes favoris", destination: "Favorites" },
	{ symbolName: "dial.low", title: "Paramètres", destination: "AppSettings" },
];

export function ProfileScreen() {
	const navigation = useNavigation<ProfileStackNavigationProp>();
	const { displayName, avatarUrl } = useAuthUser();
	const pass = usePassRingsViewModel();

	const safeDisplayName = displayName ?? "Profil";

	const handleNavigate = useCallback(
		(destination: ProfileMenuDestination) => {
			navigation.navigate(destination);
		},
		[navigation]
	);

	return (
		<ProfileLayout>
			<ProfileHero avatarUrl={avatarUrl} displayName={safeDisplayName} rings={pass.displayRings} />
			<ProfileMenuList items={MENU_ITEMS} onNavigate={handleNavigate} />
		</ProfileLayout>
	);
}

export default ProfileScreen;
