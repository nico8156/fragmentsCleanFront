import {Pressable, StyleSheet, Switch, Text, View} from "react-native";
import { useMemo, useState } from "react";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import {SymbolView} from "expo-symbols";
import {ProfileStackNavigationProp} from "@/app/adapters/primary/react/navigation/types";
import {useNavigation} from "@react-navigation/native";

export function AppSettingsScreen() {
    //TODO ajouter un bouton pour flag false onboarding
    const { displayName, primaryEmail, avatarUrl, isSignedIn, signOut } = useAuthUser();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const navigation = useNavigation<ProfileStackNavigationProp>();
    const statusLabel = useMemo(() => (isSignedIn ? "Connecté" : "Hors connexion"), [isSignedIn]);

    return (
        <ProfileLayout title="SETTINGS">
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                <SymbolView name={"chevron.backward"} weight={"bold"} size={24} tintColor={palette.accent}/>
            </Pressable>
            <ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail ?? "Non renseigné"} />
            <ProfileCard title="Préférences">
                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowTitle}>Notifications</Text>
                        <Text style={styles.rowSubtitle}>Reste informé des nouvelles offres</Text>
                    </View>
                    <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
                </View>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowTitle}>Statut</Text>
                        <Text style={styles.rowSubtitle}>{statusLabel}</Text>
                    </View>
                </View>
            </ProfileCard>
                <Pressable onPress={signOut} style={[styles.col,styles.logoutButton]}>
                    <Text style={styles.signOut} >
                        Se déconnecter
                    </Text>
                    <View>
                        <Text style={styles.rowSubtitle}>Termine ta session en toute sécurité</Text>
                    </View>
                </Pressable>
        </ProfileLayout>
    );
}

const styles = StyleSheet.create({
    logoutButton:{
      backgroundColor: palette.primary_30,
        padding: 16,
        borderRadius: 24,
        marginTop: 12,
        borderWidth: 1,
        borderColor: palette.primary_50,
    },
    backButton:{
        position:"absolute",
        top:30,
        left:30,
        borderColor:palette.primary_90
    },
    col:{
      flexDirection: "column",
        gap: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: palette.border,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    rowSubtitle: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    signOut: {
        fontSize: 20,
        color: palette.accent,
        fontWeight: "600",
    },
});

export default AppSettingsScreen;
