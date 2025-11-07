import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { ScanTicketFab } from "@/src/features/scan/components/ScanTicketFab";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@/app/adapters/primary/react/css/colors";
import {selectSortedTickets} from "@/app/core-logic/contextWL/ticketWl/selector/ticket.selector";


export function RewardsScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const inset = useSafeAreaInsets();

    const sortedTickets = useSelector(selectSortedTickets);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Passeport cafés</Text>
                    <Text style={styles.sectionSubtitle}>
                        Tes tickets scannés apparaissent ici avec le statut de vérification.
                    </Text>
                    {sortedTickets.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>Aucun ticket pour le moment</Text>
                            <Text style={styles.emptySubtitle}>
                                Scanne ton premier ticket pour commencer à cumuler des points.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={sortedTickets}
                            scrollEnabled={false}
                            keyExtractor={(item) => item.ticketId}
                            contentContainerStyle={styles.ticketList}
                            renderItem={({ item }) => (
                                <View style={styles.ticketCard}>
                                    <View style={styles.ticketHeader}>
                                        <Text style={styles.ticketTitle}>{item.ocrText?.slice(0, 48) || 'Ticket café'}</Text>
                                        <View style={[styles.statusBadge, statusStyles[item.status] ?? statusStyles.ANALYZING]}>
                                            <Text style={styles.statusText}>{statusLabels[item.status] ?? item.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.ticketMeta}>Créé le {formatDate(item.createdAt ?? item.updatedAt)}</Text>
                                    {item.amountCents != null ? (
                                        <Text style={styles.ticketAmount}>
                                            {formatCurrency(item.amountCents / 100, item.currency ?? 'EUR')}
                                        </Text>
                                    ) : null}
                                </View>
                            )}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Badges</Text>
                    <Text style={styles.sectionSubtitle}>
                        Les badges se débloquent en validant des tickets liés à tes visites.
                    </Text>
                    <PlaceholderList
                        items={["3 espresso cette semaine", "1er filtre", "Tour de Rennes"]}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Avantages partenaires</Text>
                    <Text style={styles.sectionSubtitle}>
                        Continue à scanner pour débloquer des réductions et boissons tests.
                    </Text>
                    <PlaceholderList
                        items={["-10% chez Café Moka", "Filtre offert chez Bloom", "Session latte art"]}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistiques</Text>
                    <Text style={styles.sectionSubtitle}>
                        Visualise l’impact de tes visites sur tes styles préférés.
                    </Text>
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <Text style={styles.statsLabel}>Visites scannées</Text>
                            <Text style={styles.statsValue}>{sortedTickets.length}</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <Text style={styles.statsLabel}>Tickets en attente</Text>
                            <Text style={styles.statsValue}>
                                {sortedTickets.filter((ticket) => ticket.status === 'ANALYZING').length}
                            </Text>
                        </View>
                        <View style={styles.statsRow}>
                            <Text style={styles.statsLabel}>Tickets validés</Text>
                            <Text style={styles.statsValue}>
                                {sortedTickets.filter((ticket) => ticket.status === 'CONFIRMED').length}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <ScanTicketFab onPress={() => navigation.navigate('ScanTicketModal')} insetBottom={inset.bottom} />
        </SafeAreaView>
    );
}

const statusLabels: Record<string, string> = {
    ANALYZING: 'En analyse',
    CONFIRMED: 'Confirmé',
    CAPTURED: 'Capturé',
    REJECTED: 'Refusé',
};

const statusStyles: Record<string, { backgroundColor: string; color: string }> = {
    ANALYZING: { backgroundColor: 'rgba(244,185,70,0.16)', color: '#F4B946' },
    CONFIRMED: { backgroundColor: 'rgba(79,178,142,0.18)', color: palette.success },
    CAPTURED: { backgroundColor: 'rgba(112,162,220,0.18)', color: '#6FA7FF' },
    REJECTED: { backgroundColor: 'rgba(224,92,75,0.18)', color: palette.danger },
};

function formatDate(value?: string) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
}

function formatCurrency(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency}`;
    }
}

type PlaceholderListProps = {
    items: string[];
};

function PlaceholderList({ items }: PlaceholderListProps) {
    return (
        <View style={styles.placeholderList}>
            {items.map((item) => (
                <View key={item} style={styles.placeholderItem}>
                    <View style={styles.placeholderDot} />
                    <Text style={styles.placeholderText}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        paddingBottom: 160,
        gap: 32,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    section: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: palette.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        backgroundColor: palette.elevated,
        borderRadius: 24,
        padding: 28,
        gap: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    emptySubtitle: {
        fontSize: 14,
        color: palette.textMuted,
        lineHeight: 20,
    },
    ticketList: {
        gap: 16,
    },
    ticketCard: {
        backgroundColor: palette.elevated,
        borderRadius: 20,
        padding: 18,
        gap: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ticketTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
        flex: 1,
        marginRight: 12,
    },
    ticketMeta: {
        fontSize: 13,
        color: palette.textMuted,
    },
    ticketAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.success,
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    placeholderList: {
        backgroundColor: palette.elevated,
        borderRadius: 20,
        padding: 18,
        gap: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    placeholderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    placeholderDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: palette.accent,
    },
    placeholderText: {
        fontSize: 14,
        color: palette.textPrimary,
    },
    statsCard: {
        backgroundColor: palette.elevated,
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsLabel: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    statsValue: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
});

export default RewardsScreen;
