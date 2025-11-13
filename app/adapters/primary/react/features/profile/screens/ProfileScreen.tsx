import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

import { ProfileCoffeeBadge } from "@/app/adapters/primary/react/features/profile/components/ProfileCoffeeBadge";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import {
    ProfileMenuItem,
    ProfileMenuList,
} from "@/app/adapters/primary/react/features/profile/components/ProfileMenuList";
import { ProfileStackNavigationProp, ProfileStackParamList } from "@/app/adapters/primary/react/navigation/types";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";

type ProfileMenuDestination = Exclude<keyof ProfileStackParamList, "ProfileHome">;

const MENU_ITEMS: ProfileMenuItem<ProfileMenuDestination>[] = [
    {
        symbolName: "pencil",
        title: "Edit Profile",
        destination: "EditProfile",
    },
    {
        symbolName: "list.bullet.rectangle.portrait",
        title: "Tickets",
        destination: "Tickets",
    },
    {
        symbolName: "heart.fill",
        title: "Favorites",
        destination: "Favorites",
    },
    {
        symbolName: "dial.low",
        title: "Settings",
        destination: "AppSettings",
    },
];

export function ProfileScreen() {
    const navigation = useNavigation<ProfileStackNavigationProp>();
    const { displayName, primaryEmail, avatarUrl } = useAuthUser();

    const handleNavigate = useCallback(
        (destination: ProfileMenuDestination) => {
            navigation.navigate(destination);
        },
        [navigation],
    );

    return (
        <ProfileLayout title="PROFILE">
            <ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail ?? "Non renseigné"} />
            <ProfileCoffeeBadge label="Coffee Lover" />
            <ProfileMenuList items={MENU_ITEMS} onNavigate={handleNavigate} />
        </ProfileLayout>
    );
}

export default ProfileScreen;
