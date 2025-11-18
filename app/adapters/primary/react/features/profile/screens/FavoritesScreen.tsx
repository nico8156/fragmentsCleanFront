import {Pressable, StyleSheet, Text, View} from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import {SymbolView} from "expo-symbols";
import {useNavigation} from "@react-navigation/native";
import {ProfileStackNavigationProp} from "@/app/adapters/primary/react/navigation/types";

const MOCK_FAVORITES = [
    { id: "fav-1", name: "Fragments République", description: "Paris 11e" },
    { id: "fav-2", name: "Fragments Pigalle", description: "Paris 09e" },
];

export function FavoritesScreen() {
    const { displayName, primaryEmail, avatarUrl } = useAuthUser();
    const navigation = useNavigation<ProfileStackNavigationProp>();

    return (
        <ProfileLayout title="FAVORITES">
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <SymbolView name={"chevron.backward"} weight={"bold"} size={24} tintColor={palette.accent}/>
            </Pressable>
            <ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail ?? "Non renseigné"} />
            <ProfileCard title="Cafés enregistrés" subtitle="Retrouve rapidement tes adresses préférées.">
                <View style={styles.list}>
                    {MOCK_FAVORITES.map((favorite) => (
                        <View key={favorite.id} style={styles.favorite}>
                            <Text style={styles.favoriteName}>{favorite.name}</Text>
                            <Text style={styles.favoriteDescription}>{favorite.description}</Text>
                        </View>
                    ))}
                </View>
            </ProfileCard>
        </ProfileLayout>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 12,
    },
    backButton:{
        position:"absolute",
        top:30,
        left:30,
        borderColor:palette.primary_90
    },
    favorite: {
        borderRadius: 16,
        padding: 16,
        backgroundColor: palette.bg_dark_10,
    },
    favoriteName: {
        fontSize: 16,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    favoriteDescription: {
        fontSize: 14,
        color: palette.textSecondary,
    },
});

export default FavoritesScreen;
