import { StyleSheet, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { useTicketsHistory } from "@/app/adapters/secondary/viewModel/useTicketsHistory";

const toneColors: Record<"pending" | "success" | "error", { backgroundColor: string; textColor: string }> = {
    pending: { backgroundColor: "#FFF5E0", textColor: "#8D5C00" },
    success: { backgroundColor: "#E6F6EC", textColor: "#0E7A2E" },
    error: { backgroundColor: "#FDECEA", textColor: "#B3261E" },
};

const formatLineAmount = (amountCents?: number, currency?: string) => {
    if (typeof amountCents !== "number") return null;
    try {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency ?? "EUR",
            minimumFractionDigits: 2,
        }).format(amountCents / 100);
    } catch {
        return `${(amountCents / 100).toFixed(2)} ${currency ?? "EUR"}`;
    }
};

export function TicketsScreen() {
    const { displayName, primaryEmail, avatarUrl } = useAuthUser();
    const { items, isEmpty } = useTicketsHistory();

    return (
        <ProfileLayout title="TICKETS">
            <ProfileHero avatarUrl={avatarUrl} displayName={displayName} email={primaryEmail ?? "Non renseigné"} />
            <ProfileCard title="Historique des tickets" subtitle="Surveille l'analyse de chaque justificatif.">
                {isEmpty ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>Aucun ticket actif</Text>
                        <Text style={styles.emptySubtitle}>
                            Scanne un justificatif depuis la section « Pass » pour alimenter ton historique et débloquer des droits.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {items.map((ticket) => (
                            <View key={ticket.id} style={styles.ticketRow}>
                                <View style={styles.ticketHeader}>
                                    <View>
                                        <Text style={styles.merchant}>{ticket.merchantName}</Text>
                                        <Text style={styles.date}>{ticket.dateLabel}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: toneColors[ticket.statusTone].backgroundColor }]}>
                                        <Text style={[styles.badgeLabel, { color: toneColors[ticket.statusTone].textColor }]}>
                                            {ticket.statusLabel}
                                        </Text>
                                    </View>
                                </View>
                                {ticket.amountLabel ? (
                                    <Text style={styles.amount}>{ticket.amountLabel}</Text>
                                ) : null}
                                {ticket.paymentMethod ? (
                                    <Text style={styles.paymentMethod}>Paiement : {ticket.paymentMethod}</Text>
                                ) : null}
                                {ticket.lineItems?.length ? (
                                    <View style={styles.itemsBlock}>
                                        {ticket.lineItems.slice(0, 3).map((line, index) => (
                                            <View key={`${ticket.id}_${line.label}_${index}`} style={styles.lineItem}>
                                                <Text style={styles.lineLabel}>{line.label}</Text>
                                                {formatLineAmount(line.amountCents, ticket.currency) ? (
                                                    <Text style={styles.lineAmount}>
                                                        {formatLineAmount(line.amountCents, ticket.currency)}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        ))}
                                        {ticket.lineItems.length > 3 ? (
                                            <Text style={styles.moreItems}>… {ticket.lineItems.length - 3} lignes supplémentaires</Text>
                                        ) : null}
                                    </View>
                                ) : null}
                                {ticket.rejectionReason ? (
                                    <Text style={styles.rejection}>Raison : {ticket.rejectionReason}</Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}
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
    list: {
        gap: 16,
    },
    ticketRow: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 16,
        gap: 8,
        backgroundColor: "#FFFFFF",
    },
    ticketHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    merchant: {
        fontSize: 16,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    date: {
        fontSize: 13,
        color: palette.textSecondary,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    amount: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    paymentMethod: {
        fontSize: 13,
        color: "#6B7280",
    },
    itemsBlock: {
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 8,
        gap: 4,
    },
    lineItem: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    lineLabel: {
        fontSize: 13,
        color: palette.textPrimary,
    },
    lineAmount: {
        fontSize: 13,
        color: palette.textPrimary,
        fontVariant: ["tabular-nums"],
    },
    moreItems: {
        fontSize: 12,
        color: "#6B7280",
        fontStyle: "italic",
    },
    rejection: {
        fontSize: 13,
        color: "#B3261E",
        fontWeight: "500",
    },
});

export default TicketsScreen;
