import { StyleSheet, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";

export function TicketsScreen() {
    const { displayName, primaryEmail, avatarUrl } = useAuthUser();

    return (
        <ProfileLayout title="TICKETS">
            <ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail ?? "Non renseigné"} />
            <ProfileCard title="Historique des tickets" subtitle="Retrouve facilement tes derniers scans.">
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Aucun ticket actif</Text>
                    <Text style={styles.emptySubtitle}>
                        Scanne un QR code depuis la section « Pass » pour alimenter ton historique et profiter des récompenses.
                    </Text>
                </View>
            </ProfileCard>
        </ProfileLayout>
    );
}

const styles = StyleSheet.create({
    emptyState: {
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    emptySubtitle: {
        fontSize: 14,
        color: palette.textSecondary,
        lineHeight: 20,
    },
});

export default TicketsScreen;
