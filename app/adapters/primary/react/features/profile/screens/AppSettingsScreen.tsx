import { StyleSheet, Switch, Text, View } from "react-native";
import { useMemo, useState } from "react";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";

export function AppSettingsScreen() {
    const { displayName, primaryEmail, avatarUrl, isSignedIn, signOut } = useAuthUser();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const statusLabel = useMemo(() => (isSignedIn ? "Connecté" : "Hors connexion"), [isSignedIn]);

    return (
        <ProfileLayout title="SETTINGS">
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
                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowTitle}>Déconnexion</Text>
                        <Text style={styles.rowSubtitle}>Termine ta session en toute sécurité</Text>
                    </View>
                    <Text style={styles.signOut} onPress={signOut}>
                        Se déconnecter
                    </Text>
                </View>
            </ProfileCard>
        </ProfileLayout>
    );
}

const styles = StyleSheet.create({
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
        color: palette.accent,
        fontWeight: "600",
    },
});

export default AppSettingsScreen;
