// RewardsScreen.tsx
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanTicketFab } from "@/app/adapters/primary/react/features/scan/components/ScanTicketFab";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import {useRewardsViewModel} from "@/app/adapters/secondary/viewModel/useRewardsVM";

const BADGE_ICONS: Record<string, string> = {
    urban_explorer: "🧭",
    coffee_taster: "☕️",
    social_bean: "🤝",
    fragments_master: "🏆",
};

export function RewardsScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const inset = useSafeAreaInsets();

    const { progress, confirmedTickets, badges, unlockedCount } = useRewardsViewModel();

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={badges}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.container}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.headerTopRow}>
                            <View style={styles.headerTitleBlock}>
                                <Text style={styles.title}>Tes badges</Text>
                                <Text style={styles.subtitle}>
                                    Trois axes simples : exploration, goût, social. Tout est calculé à partir de ton activité.
                                </Text>
                            </View>

                            <View style={styles.unlockedCard}>
                                <Text style={styles.unlockedCount}>{unlockedCount}</Text>
                                <Text style={styles.unlockedCaption}>sur {badges.length}</Text>
                                <Text style={styles.unlockedLabel}>badges débloqués</Text>
                            </View>
                        </View>

                        <View style={styles.axisRow}>
                            <View style={styles.axisCard}>
                                <Text style={styles.axisIcon}>🔍</Text>
                                <View>
                                    <Text style={styles.axisValue}>{progress.exploration}</Text>
                                    <Text style={styles.axisLabel}>Exploration</Text>
                                </View>
                            </View>
                            <View style={styles.axisCard}>
                                <Text style={styles.axisIcon}>☕️</Text>
                                <View>
                                    <Text style={styles.axisValue}>{progress.gout}</Text>
                                    <Text style={styles.axisLabel}>Goût</Text>
                                </View>
                            </View>
                            <View style={styles.axisCard}>
                                <Text style={styles.axisIcon}>💬</Text>
                                <View>
                                    <Text style={styles.axisValue}>{progress.social}</Text>
                                    <Text style={styles.axisLabel}>Social</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.ticketsCard}>
                            <View>
                                <Text style={styles.ticketsLabel}>Tickets validés</Text>
                                <Text style={styles.ticketsHint}>Chaque ticket confirmé fait progresser tes badges.</Text>
                            </View>
                            <Text style={styles.ticketsValue}>{confirmedTickets}</Text>
                        </View>
                    </View>

                }
                renderItem={({ item }) => {
                    const remaining = Math.max(0, item.totalRequired - item.currentSteps);
                    const progressPercent = item.completion * 100;

                    const statusLabel =
                        item.status === "unlocked"
                            ? "Débloqué"
                            : item.status === "in_progress"
                                ? "En cours"
                                : "Verrouillé";

                    const statusStyle =
                        item.status === "unlocked"
                            ? styles.unlocked
                            : item.status === "in_progress"
                                ? styles.in_progress
                                : styles.locked;

                    return (
                        <View style={styles.badgeCard}>
                            <View style={styles.badgeHeaderRow}>
                                <Text style={styles.badgeIcon}>{BADGE_ICONS[item.id] ?? "🎖️"}</Text>
                                <View style={styles.badgeHeaderText}>
                                    <Text style={styles.badgeName}>{item.label}</Text>
                                    <Text style={styles.badgeStatusLabel}>{statusLabel}</Text>
                                </View>
                                <Text style={[styles.statusPill, statusStyle]}>{statusLabel}</Text>
                            </View>

                            <Text style={styles.badgeDescription}>{item.description}</Text>

                            <View style={styles.progressRow}>
                                <Text style={styles.badgeProgressText}>
                                    Progression {item.currentSteps}/{item.totalRequired}
                                </Text>
                                <Text style={styles.badgeProgressPercent}>{progressPercent.toFixed(0)}%</Text>
                            </View>

                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${progressPercent}%` },
                                    ]}
                                />
                            </View>

                            <View style={styles.requirementsRow}>
                                <Text style={styles.requirementTiny}>
                                    🔍 Explo.{" "}
                                    {Math.min(progress.exploration, item.requirements.exploration)} /
                                    {item.requirements.exploration}
                                </Text>
                                <Text style={styles.requirementTiny}>
                                    ☕️ Goût {Math.min(progress.gout, item.requirements.gout)} /
                                    {item.requirements.gout}
                                </Text>
                                <Text style={styles.requirementTiny}>
                                    💬 Social {Math.min(progress.social, item.requirements.social)} /
                                    {item.requirements.social}
                                </Text>
                            </View>

                            {remaining > 0 ? (
                                <Text style={styles.badgeFootnote}>
                                    Encore {remaining} point(s) d’activité avant de débloquer ce badge.
                                </Text>
                            ) : (
                                <Text style={styles.badgeFootnoteUnlocked}>Badge débloqué 🎉</Text>
                            )}
                        </View>
                    );
                }}
            />

            <ScanTicketFab
                onPress={() => navigation.navigate("ScanTicketModal")}
                insetBottom={inset.bottom}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        paddingBottom: 160,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
    },
    header: {
        backgroundColor: palette.elevated,
        borderRadius: 24,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        gap: 16,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: palette.textPrimary,
    },
    subtitle: {
        color: palette.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 4,
    },
    statPill: {
        backgroundColor: palette.overlay,
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        minWidth: 80,
    },
    statValue: {
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: "700",
    },
    statLabel: {
        color: palette.textMuted,
        fontSize: 12,
    },
    badgeSummaryRow: {
        marginTop: 6,
        gap: 2,
    },
    badgeSummaryText: {
        color: palette.textPrimary,
        fontWeight: "600",
        fontSize: 14,
    },
    badgeSummaryHint: {
        color: palette.textMuted,
        fontSize: 12,
    },
    badgeCard: {
        backgroundColor: palette.elevated,
        borderRadius: 18,
        padding: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        gap: 8,
    },
    badgeHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    badgeIcon: {
        fontSize: 28,
    },
    badgeHeaderText: {
        flex: 1,
        gap: 2,
    },
    badgeName: {
        color: palette.textPrimary,
        fontSize: 15,
        fontWeight: "700",
    },
    badgeStatusLabel: {
        color: palette.textMuted,
        fontSize: 12,
    },
    badgeDescription: {
        color: palette.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    progressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    badgeProgressText: {
        color: palette.textPrimary,
        fontSize: 12,
        fontWeight: "600",
    },
    badgeProgressPercent: {
        color: palette.textMuted,
        fontSize: 12,
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 999,
        backgroundColor: palette.overlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        overflow: "hidden",
        marginTop: 2,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: palette.accent,
    },
    requirementsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        marginTop: 6,
        gap: 4,
    },
    requirementTiny: {
        color: palette.textMuted,
        fontSize: 11,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        fontSize: 11,
        overflow: "hidden",
        color: palette.textPrimary,
    },
    unlocked: {
        backgroundColor: "rgba(79,178,142,0.16)",
        borderColor: palette.success,
    },
    in_progress: {
        backgroundColor: "rgba(244,185,70,0.14)",
        borderColor: "#F4B946",
    },
    locked: {
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: palette.border,
    },
    badgeFootnote: {
        marginTop: 4,
        color: palette.textMuted,
        fontSize: 11,
    },
    badgeFootnoteUnlocked: {
        marginTop: 4,
        color: palette.success,
        fontSize: 11,
        fontWeight: "600",
    },

    headerTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    headerTitleBlock: {
        flex: 1,
        gap: 6,
    },
    unlockedCard: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: palette.overlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        alignItems: "center",
        minWidth: 90,
    },
    unlockedCount: {
        fontSize: 24,
        fontWeight: "800",
        color: palette.accent,
    },
    unlockedCaption: {
        fontSize: 12,
        color: palette.textSecondary,
    },
    unlockedLabel: {
        fontSize: 11,
        color: palette.textMuted,
    },

    axisRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    axisCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: palette.overlay,
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    axisIcon: {
        fontSize: 18,
    },
    axisValue: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: "700",
    },
    axisLabel: {
        color: palette.textMuted,
        fontSize: 12,
    },

    ticketsCard: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: palette.overlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    ticketsLabel: {
        color: palette.textPrimary,
        fontSize: 13,
        fontWeight: "600",
    },
    ticketsHint: {
        color: palette.textMuted,
        fontSize: 11,
    },
    ticketsValue: {
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: "700",
    },

});

export default RewardsScreen;
