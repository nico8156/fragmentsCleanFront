import { useMemo } from "react";
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { RootStateWl } from "@/app/store/reduxStoreWl";
import { ScanTicketFab } from "@/src/features/scan/components/ScanTicketFab";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function RewardsScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const inset = useSafeAreaInsets();
    const tickets = useSelector((state: RootStateWl) => Object.values(state.tState.byId));

    const sortedTickets = useMemo(() => {
        return [...tickets].sort((a, b) => {
            const dateA = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
            const dateB = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
            return dateB - dateA;
        });
    }, [tickets]);

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
    ANALYZING: { backgroundColor: 'rgba(255,204,0,0.16)', color: '#B8860B' },
    CONFIRMED: { backgroundColor: 'rgba(52,199,89,0.16)', color: '#1B9C45' },
    CAPTURED: { backgroundColor: 'rgba(90,200,250,0.16)', color: '#0077B6' },
    REJECTED: { backgroundColor: 'rgba(255,59,48,0.16)', color: '#C0392B' },
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
        backgroundColor: '#F5F5F5',
    },
    container: {
        paddingBottom: 160,
        gap: 32,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6E6E73',
        lineHeight: 20,
    },
    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        gap: 8,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6E6E73',
        lineHeight: 20,
    },
    ticketList: {
        gap: 16,
    },
    ticketCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 8,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ticketTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        flex: 1,
        marginRight: 12,
    },
    ticketMeta: {
        fontSize: 13,
        color: '#6E6E73',
    },
    ticketAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1B9C45',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
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
        backgroundColor: '#4F46E5',
    },
    placeholderText: {
        fontSize: 14,
        color: '#1F1F1F',
    },
    statsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsLabel: {
        fontSize: 14,
        color: '#3A3A3C',
    },
    statsValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
});

export default RewardsScreen;
