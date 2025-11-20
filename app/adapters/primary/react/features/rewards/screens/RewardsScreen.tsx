import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanTicketFab } from "@/app/adapters/primary/react/features/scan/components/ScanTicketFab";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { selectSortedTickets } from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";

type BadgeCategory = "taste" | "exploration" | "community" | "special";

type BadgeStep = {
    id: string;
    title: string;
    description: string;
    status: "done" | "current" | "locked";
    progress?: number;
};

type Badge = {
    id: string;
    name: string;
    category: BadgeCategory;
    description: string;
    icon: string;
    status: "unlocked" | "in_progress" | "locked";
    progress: number;
    goalLabel: string;
    level?: { current: number; max: number };
    actionsRemaining?: number;
    steps: BadgeStep[];
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
    taste: "Goût",
    exploration: "Exploration",
    community: "Communauté",
    special: "Spéciaux",
};

const badgeCollection: Badge[] = [
    {
        id: "coffee-curious",
        name: "Coffee Curious",
        category: "taste",
        description: "Tu explores les bases : chaque tasse te rapproche d'une nouvelle découverte.",
        icon: "☕️",
        status: "unlocked",
        progress: 1,
        goalLabel: "3 cafés goûtés",
        level: { current: 1, max: 5 },
        steps: [
            { id: "step-1", title: "Premiers grains", description: "1 café dégusté", status: "done" },
            { id: "step-2", title: "Curieux", description: "3 cafés dégustés", status: "current" },
            { id: "step-3", title: "Explorateur", description: "5 cafés dégustés", status: "locked" },
        ],
    },
    {
        id: "espresso-lover",
        name: "Espresso Lover",
        category: "taste",
        description: "Tu commences à vraiment aimer l'espresso !",
        icon: "🎯",
        status: "in_progress",
        progress: 0.8,
        goalLabel: "5 cafés visités (4/5)",
        level: { current: 2, max: 5 },
        actionsRemaining: 1,
        steps: [
            { id: "step-1", title: "Coffee Curious", description: "Obtenu", status: "done" },
            { id: "step-2", title: "Espresso Lover", description: "4/5 visites", status: "current", progress: 0.8 },
            { id: "step-3", title: "Double Shot Hero", description: "Encore 3 visites", status: "locked" },
            { id: "step-4", title: "Crema Master", description: "Goûte 15 expressos", status: "locked" },
        ],
    },
    {
        id: "double-shot-hero",
        name: "Double Shot Hero",
        category: "taste",
        description: "Tu enchaînes les shots : la crema n'a plus de secret.",
        icon: "⚡️",
        status: "locked",
        progress: 0.2,
        goalLabel: "15 expressos (3/15)",
        actionsRemaining: 12,
        steps: [
            { id: "step-1", title: "Espresso Lover", description: "Débloque Espresso Lover", status: "done" },
            { id: "step-2", title: "Double Shot Hero", description: "3/15 expressos", status: "current", progress: 0.2 },
            { id: "step-3", title: "Crema Master", description: "Encore 12 expressos", status: "locked" },
        ],
    },
    {
        id: "city-trekker",
        name: "City Trekker",
        category: "exploration",
        description: "Chaque café est une étape de ton tour urbain.",
        icon: "🗺️",
        status: "in_progress",
        progress: 0.45,
        goalLabel: "Tour de la ville (9/20)",
        actionsRemaining: 11,
        steps: [
            { id: "step-1", title: "Tour de Rennes", description: "5 cafés visités", status: "done" },
            { id: "step-2", title: "City Trekker", description: "9/20 cafés", status: "current", progress: 0.45 },
            { id: "step-3", title: "Globe Sipper", description: "Découvre 30 cafés", status: "locked" },
        ],
    },
    {
        id: "community-builder",
        name: "Community Builder",
        category: "community",
        description: "Tu partages tes spots et inspires la communauté.",
        icon: "🤝",
        status: "in_progress",
        progress: 0.35,
        goalLabel: "5 recommandations (2/5)",
        actionsRemaining: 3,
        steps: [
            { id: "step-1", title: "Premiers partages", description: "1 reco postée", status: "done" },
            { id: "step-2", title: "Community Builder", description: "2/5 recos", status: "current", progress: 0.35 },
            { id: "step-3", title: "Mentor", description: "10 recos", status: "locked" },
        ],
    },
    {
        id: "night-owl",
        name: "Night Owl",
        category: "special",
        description: "Toujours là pour un café tardif, tu connais les spots secrets.",
        icon: "🌙",
        status: "unlocked",
        progress: 1,
        goalLabel: "3 cafés après 21h",
        steps: [
            { id: "step-1", title: "Explorateur nocturne", description: "1 café tardif", status: "done" },
            { id: "step-2", title: "Night Owl", description: "3 cafés tardifs", status: "done" },
            { id: "step-3", title: "Lune noire", description: "5 cafés tardifs", status: "locked" },
        ],
    },
];

export function RewardsScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const inset = useSafeAreaInsets();

    const sortedTickets = useSelector(selectSortedTickets);

    const [activeCategory, setActiveCategory] = useState<BadgeCategory>("taste");
    const [selectedBadgeId, setSelectedBadgeId] = useState<string>("espresso-lover");

    const filteredBadges = useMemo(
        () => badgeCollection.filter((badge) => badge.category === activeCategory),
        [activeCategory],
    );

    const selectedBadge = useMemo(() => {
        const foundBadge = badgeCollection.find((badge) => badge.id === selectedBadgeId);
        if (foundBadge) return foundBadge;
        return filteredBadges[0];
    }, [filteredBadges, selectedBadgeId]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Mes Badges</Text>
                        <Text style={styles.subtitle}>
                            Progresser dans les cafés te fait grimper dans les familles Goût, Exploration, Communauté et
                            débloquer les spéciaux.
                        </Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>{sortedTickets.length}</Text>
                                <Text style={styles.statLabel}>tickets scannés</Text>
                            </View>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>
                                    {sortedTickets.filter((ticket) => ticket.status === "CONFIRMED").length}
                                </Text>
                                <Text style={styles.statLabel}>validés</Text>
                            </View>
                            <View style={styles.statPill}>
                                <Text style={styles.statValue}>
                                    {sortedTickets.filter((ticket) => ticket.status === "ANALYZING").length}
                                </Text>
                                <Text style={styles.statLabel}>en analyse</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Familles</Text>
                    <View style={styles.tabBar}>
                        {(Object.keys(CATEGORY_LABELS) as BadgeCategory[]).map((category) => {
                            const isActive = category === activeCategory;
                            return (
                                <Pressable
                                    key={category}
                                    onPress={() => setActiveCategory(category)}
                                    style={[styles.tab, isActive && styles.tabActive]}
                                >
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                        {CATEGORY_LABELS[category]}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <Text style={styles.sectionHint}>3 colonnes pour visualiser ta progression par famille.</Text>
                    <FlatList<Badge>
                        data={filteredBadges}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.badgeRow}
                        contentContainerStyle={styles.badgeGrid}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => setSelectedBadgeId(item.id)}
                                style={[styles.badgeCard, selectedBadgeId === item.id && styles.badgeCardSelected]}
                            >
                                <View style={[styles.badgeIconWrapper, badgeStatusStyle[item.status]]}>
                                    <View style={[styles.badgeHalo, { opacity: item.status === "locked" ? 0.3 : 0.7 }]} />
                                    <Text style={styles.badgeIcon}>{item.icon}</Text>
                                    {item.status !== "unlocked" && (
                                        <View style={[styles.progressRing, { borderColor: palette.accent }]}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${Math.max(14, item.progress * 100)}%` },
                                                ]}
                                            />
                                        </View>
                                    )}
                                </View>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.badgeName, item.status === "locked" && styles.badgeMuted]}
                                >
                                    {item.name}
                                </Text>
                                <Text style={styles.badgeGoal}>{item.goalLabel}</Text>
                                {item.actionsRemaining != null ? (
                                    <Text style={styles.badgeRemaining}>
                                        {item.actionsRemaining} action{item.actionsRemaining > 1 ? "s" : ""} restante{item.actionsRemaining > 1 ? "s" : ""}
                                    </Text>
                                ) : (
                                    <Text style={styles.badgeRemaining}>Débloqué</Text>
                                )}
                            </Pressable>
                        )}
                    />
                </View>

                {selectedBadge ? (
                    <View style={styles.detailSection}>
                        <Text style={styles.sectionLabel}>Progression</Text>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailIcon}>{selectedBadge.icon}</Text>
                            <Text style={styles.detailTitle}>{selectedBadge.name}</Text>
                            {selectedBadge.level ? (
                                <Text style={styles.detailLevel}>
                                    Niveau {selectedBadge.level.current} / {selectedBadge.level.max}
                                </Text>
                            ) : null}
                            <Text style={styles.detailDescription}>{selectedBadge.description}</Text>
                            <Text style={styles.detailObjective}>Objectif : {selectedBadge.goalLabel}</Text>
                            <View style={styles.progressBarBackground}>
                                <View style={[styles.progressBarFill, { width: `${selectedBadge.progress * 100}%` }]} />
                            </View>
                            <Pressable style={styles.ctaButton}>
                                <Text style={styles.ctaText}>Voir activités liées</Text>
                            </Pressable>
                        </View>

                        <Text style={[styles.sectionLabel, styles.timelineLabel]}>Timeline</Text>
                        <View style={styles.timeline}>
                            {selectedBadge.steps.map((step, index) => (
                                <View key={step.id} style={styles.timelineRow}>
                                    <View style={styles.timelineIconWrapper}>
                                        {index !== 0 && <View style={styles.timelineConnector} />}
                                        <View
                                            style={[
                                                styles.timelineIcon,
                                                step.status === "done" && styles.timelineIconDone,
                                                step.status === "current" && styles.timelineIconCurrent,
                                            ]}
                                        >
                                            <Text style={styles.timelineDot}>{step.status === "locked" ? "○" : "●"}</Text>
                                        </View>
                                        {index !== selectedBadge.steps.length - 1 && <View style={styles.timelineConnector} />}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineTitle}>{step.title}</Text>
                                        <Text style={styles.timelineDescription}>{step.description}</Text>
                                        {step.status === "current" && step.progress != null ? (
                                            <View style={styles.timelineProgress}>
                                                <View style={[styles.timelineProgressFill, { width: `${step.progress * 100}%` }]} />
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
            <ScanTicketFab onPress={() => navigation.navigate("ScanTicketModal")} insetBottom={inset.bottom} />
        </SafeAreaView>
    );
}

const badgeStatusStyle: Record<Badge["status"], { backgroundColor: string; borderColor: string }> = {
    unlocked: { backgroundColor: "rgba(79,178,142,0.14)", borderColor: palette.success },
    in_progress: { backgroundColor: "rgba(244,185,70,0.12)", borderColor: "#F4B946" },
    locked: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: palette.border },
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        paddingBottom: 160,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 28,
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
        fontSize: 26,
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
    tabBar: {
        flexDirection: "row",
        gap: 10,
        backgroundColor: palette.elevated,
        padding: 8,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: "transparent",
    },
    tabActive: {
        backgroundColor: palette.accentSoft,
    },
    tabText: {
        color: palette.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    tabTextActive: {
        color: palette.textPrimary,
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
        padding: 12,
        alignItems: "center",
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
    badgeIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderWidth: 1,
    },
    badgeHalo: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 20,
        backgroundColor: "rgba(200,106,58,0.14)",
    },
    badgeIcon: {
        fontSize: 32,
    },
    progressRing: {
        position: "absolute",
        bottom: -6,
        left: 8,
        right: 8,
        height: 6,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(244,185,70,0.12)",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#F4B946",
    },
    badgeName: {
        color: palette.textPrimary,
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
    },
    badgeGoal: {
        color: palette.textSecondary,
        fontSize: 12,
        textAlign: "center",
    },
    badgeRemaining: {
        color: palette.textMuted,
        fontSize: 12,
        textAlign: "center",
    },
    badgeMuted: {
        color: palette.textMuted,
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
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
    },
    detailLevel: {
        color: palette.textSecondary,
        textAlign: "center",
        fontSize: 14,
    },
    detailDescription: {
        color: palette.textSecondary,
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    detailObjective: {
        color: palette.textPrimary,
        fontSize: 14,
        textAlign: "center",
    },
    progressBarBackground: {
        height: 12,
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
    ctaButton: {
        backgroundColor: palette.accent,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 4,
    },
    ctaText: {
        color: palette.background,
        fontSize: 14,
        fontWeight: "700",
    },
    timelineLabel: {
        marginTop: 6,
    },
    timeline: {
        backgroundColor: palette.elevated,
        borderRadius: 18,
        padding: 16,
        gap: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    timelineRow: {
        flexDirection: "row",
        gap: 12,
    },
    timelineIconWrapper: {
        alignItems: "center",
        width: 24,
    },
    timelineIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.overlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    timelineIconDone: {
        backgroundColor: "rgba(79,178,142,0.12)",
        borderColor: palette.success,
    },
    timelineIconCurrent: {
        backgroundColor: "rgba(244,185,70,0.16)",
        borderColor: "#F4B946",
    },
    timelineDot: {
        color: palette.textPrimary,
        fontSize: 12,
        lineHeight: 14,
    },
    timelineConnector: {
        width: 2,
        flex: 1,
        backgroundColor: palette.border,
    },
    timelineContent: {
        flex: 1,
        gap: 4,
    },
    timelineTitle: {
        color: palette.textPrimary,
        fontWeight: "700",
        fontSize: 14,
    },
    timelineDescription: {
        color: palette.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    timelineProgress: {
        height: 8,
        borderRadius: 999,
        backgroundColor: palette.overlay,
        overflow: "hidden",
    },
    timelineProgressFill: {
        height: "100%",
        backgroundColor: palette.accent,
    },
});

export default RewardsScreen;
