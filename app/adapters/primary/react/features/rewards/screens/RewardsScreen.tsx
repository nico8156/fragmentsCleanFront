import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanTicketFab } from "@/app/adapters/primary/react/features/scan/components/ScanTicketFab";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { BADGE_DEFINITIONS, computeBadgeCompletion, getDefaultBadgeProgress } from "@/app/core-logic/contextWL/userWl/badges/badges";
import { selectCurrentUser } from "@/app/core-logic/contextWL/userWl/selector/user.selector";
import { BadgeProgress } from "@/app/core-logic/contextWL/userWl/typeAction/user.type";
import { selectSortedTickets } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";

const BADGE_ICONS: Record<string, string> = {
    urban_explorer: "🧭",
    coffee_taster: "☕️",
    social_bean: "🤝",
    fragments_master: "🏆",
};

const ASCII_MOCK = `
┌───────────────────────────────┐
│            BADGES             │
│───────────────────────────────│

 Urban Explorer          Coffee Taster
 [ ● icon ]              [ ○ lock ]
 Progress 3/5            Progress 1/3
 --------------------    --------------------

 Social Bean             Fragments Master
 [ ○ lock ]              [ ○ lock ]
 Progress 4/10           Progress 2/13
 --------------------    --------------------
└───────────────────────────────┘
`;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function RewardsScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const inset = useSafeAreaInsets();

    const sortedTickets = useSelector(selectSortedTickets);
    const user = useSelector(selectCurrentUser);
    const progress: BadgeProgress = user?.preferences?.badgeProgress ?? getDefaultBadgeProgress();

    const decoratedBadges = useMemo(
        () =>
            BADGE_DEFINITIONS.map((badge) => {
                const completion = computeBadgeCompletion(progress, badge);
                const totalRequired =
                    badge.requirements.exploration + badge.requirements.gout + badge.requirements.social || 1;
                const currentSteps =
                    Math.min(progress.exploration, badge.requirements.exploration) +
                    Math.min(progress.gout, badge.requirements.gout) +
                    Math.min(progress.social, badge.requirements.social);

                const status = progress.unlockedBadges.includes(badge.id)
                    ? "unlocked"
                    : completion > 0
                        ? "in_progress"
                        : "locked";

                return {
                    ...badge,
                    completion,
                    currentSteps,
                    totalRequired,
                    status,
                };
            }),
        [progress],
    );

    const [selectedBadgeId, setSelectedBadgeId] = useState<string>(decoratedBadges[0]?.id ?? BADGE_DEFINITIONS[0].id);

    const selectedBadge = useMemo(
        () => decoratedBadges.find((badge) => badge.id === selectedBadgeId) ?? decoratedBadges[0],
        [decoratedBadges, selectedBadgeId],
    );

    const confirmedTickets = useMemo(
        () => sortedTickets.filter((ticket) => ticket.status === "CONFIRMED").length,
        [sortedTickets],
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Badges progressifs</Text>
                        <Text style={styles.subtitle}>
                            Quatre badges simples, basés sur l'exploration, le goût et les interactions sociales. La progression est
                            stockée dans ton profil utilisateur.
                        </Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>{progress.exploration}</Text>
                                <Text style={styles.statLabel}>Exploration</Text>
                            </View>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>{progress.gout}</Text>
                                <Text style={styles.statLabel}>Goût</Text>
                            </View>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>{progress.social}</Text>
                                <Text style={styles.statLabel}>Social</Text>
                            </View>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>{confirmedTickets}</Text>
                                <Text style={styles.statLabel}>Tickets validés</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.asciiCard}>
                    <Text style={styles.sectionLabel}>Mock ASCII</Text>
                    <Text style={styles.ascii}>{ASCII_MOCK}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Badges</Text>
                    <Text style={styles.sectionHint}>
                        3 axes (exploration, goût, social) → progression cumulée. Sélectionne un badge pour voir le détail.
                    </Text>
                    <FlatList
                        data={decoratedBadges}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.badgeRow}
                        contentContainerStyle={styles.badgeGrid}
                        renderItem={({ item }) => {
                            const isSelected = selectedBadge?.id === item.id;
                            const remaining = Math.max(0, item.totalRequired - item.currentSteps);
                            const statusStyle =
                                item.status === "unlocked"
                                    ? styles.unlocked
                                    : item.status === "in_progress"
                                        ? styles.in_progress
                                        : styles.locked;
                            return (
                                <Pressable
                                    onPress={() => setSelectedBadgeId(item.id)}
                                    style={[styles.badgeCard, isSelected && styles.badgeCardSelected]}
                                >
                                    <Text style={styles.badgeIcon}>{BADGE_ICONS[item.id] ?? "🎖️"}</Text>
                                    <Text style={styles.badgeName}>{item.label}</Text>
                                    <Text style={styles.badgeDescription}>{item.description}</Text>
                                    <Text style={styles.badgeProgress}>
                                        Progression {item.currentSteps}/{item.totalRequired}
                                    </Text>
                                    <View style={styles.progressBarBackground}>
                                        <View style={[styles.progressBarFill, { width: `${clamp(item.completion) * 100}%` }]} />
                                    </View>
                                    <View style={styles.badgeStatusRow}>
                                        <Text style={[styles.statusPill, statusStyle]}>
                                            {item.status === "unlocked" ? "Débloqué" : item.status === "in_progress" ? "En cours" : "Verrouillé"}
                                        </Text>
                                        <Text style={styles.statusPill}>🔒 {remaining} restant</Text>
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                </View>

                {selectedBadge ? (
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionLabel}>Détail du badge</Text>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailIcon}>{BADGE_ICONS[selectedBadge.id] ?? "🎖️"}</Text>
                            <Text style={styles.detailTitle}>{selectedBadge.label}</Text>
                            <Text style={styles.detailDescription}>{selectedBadge.description}</Text>

                            <View style={styles.requirementRow}>
                                <Text style={styles.requirementLabel}>Exploration</Text>
                                <Text style={styles.requirementValue}>
                                    {Math.min(progress.exploration, selectedBadge.requirements.exploration)} /
                                    {" "}
                                    {selectedBadge.requirements.exploration}
                                </Text>
                            </View>
                            <View style={styles.requirementRow}>
                                <Text style={styles.requirementLabel}>Goût</Text>
                                <Text style={styles.requirementValue}>
                                    {Math.min(progress.gout, selectedBadge.requirements.gout)} / {selectedBadge.requirements.gout}
                                </Text>
                            </View>
                            <View style={styles.requirementRow}>
                                <Text style={styles.requirementLabel}>Social</Text>
                                <Text style={styles.requirementValue}>
                                    {Math.min(progress.social, selectedBadge.requirements.social)} / {selectedBadge.requirements.social}
                                </Text>
                            </View>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[styles.progressBarFill, { width: `${clamp(selectedBadge.completion) * 100}%` }]}
                                />
                            </View>
                            <Text style={styles.detailFootnote}>
                                Progression globale : {(clamp(selectedBadge.completion) * 100).toFixed(0)}%
                            </Text>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
            <ScanTicketFab onPress={() => navigation.navigate("ScanTicketModal")} insetBottom={inset.bottom} />
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
        gap: 24,
    },
    header: {
        backgroundColor: palette.elevated,
        borderRadius: 24,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    headerText: {
        gap: 12,
    },
    title: {
        fontSize: 24,
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
    },
    statPill: {
        backgroundColor: palette.overlay,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        minWidth: 86,
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
    section: {
        gap: 12,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: palette.textPrimary,
    },
    sectionHint: {
        color: palette.textMuted,
        fontSize: 13,
    },
    badgeGrid: {
        gap: 14,
    },
    badgeRow: {
        gap: 12,
    },
    badgeCard: {
        flex: 1,
        backgroundColor: palette.elevated,
        borderRadius: 16,
        padding: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        gap: 8,
    },
    badgeCardSelected: {
        borderColor: palette.accent,
        shadowColor: palette.accent,
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    badgeIcon: {
        fontSize: 28,
    },
    badgeName: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: "700",
    },
    badgeDescription: {
        color: palette.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
    badgeProgress: {
        color: palette.textPrimary,
        fontSize: 12,
        fontWeight: "600",
    },
    badgeStatusRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        color: palette.textPrimary,
        backgroundColor: palette.overlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        fontSize: 12,
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
    asciiCard: {
        backgroundColor: palette.elevated,
        padding: 12,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    ascii: {
        color: palette.textSecondary,
        fontFamily: "Menlo",
        marginTop: 6,
    },
    detailSection: {
        gap: 10,
    },
    detailCard: {
        backgroundColor: palette.elevated,
        borderRadius: 24,
        padding: 20,
        gap: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    detailIcon: {
        fontSize: 40,
        textAlign: "center",
    },
    detailTitle: {
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: "700",
        textAlign: "center",
    },
    detailDescription: {
        color: palette.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
    },
    requirementRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
    },
    requirementLabel: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: "600",
    },
    requirementValue: {
        color: palette.textSecondary,
        fontSize: 14,
    },
    progressBarBackground: {
        height: 10,
        borderRadius: 999,
        backgroundColor: palette.overlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: palette.accent,
    },
    detailFootnote: {
        color: palette.textMuted,
        fontSize: 12,
        textAlign: "center",
    },
});

export default RewardsScreen;
