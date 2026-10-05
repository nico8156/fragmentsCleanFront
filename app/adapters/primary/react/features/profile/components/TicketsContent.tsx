import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";

import { palette } from "@/app/adapters/primary/react/css/colors";
import type { TicketHistoryItemVM, useTicketsHistory } from "@/app/adapters/secondary/viewModel/useTicketsHistory";

const toneColors: Record<
	"pending" | "success" | "error",
	{ backgroundColor: string; textColor: string }
> = {
	pending: { backgroundColor: palette.elevated, textColor: palette.textSecondary },
	success: { backgroundColor: palette.elevated, textColor: palette.success },
	error: { backgroundColor: palette.elevated, textColor: palette.danger },
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

export function TicketsContent({ vm }: { vm: ReturnType<typeof useTicketsHistory> }) {
	const {
		recentItems, archivedItems, archiveCount, summary, isEmpty,
		isLoading, isLoadingMore, error, hasMore, refresh, loadMore,
	} = vm;
	const [archiveExpanded, setArchiveExpanded] = useState(false);

	const renderTicketCard = (ticket: TicketHistoryItemVM) => (
		<View key={ticket.id} style={styles.ticketCard}>
			<View style={styles.ticketHeader}>
				<View style={styles.ticketTitleBlock}>
					<Text style={styles.merchant}>{ticket.merchantName}</Text>
					<Text style={styles.date}>{ticket.dateLabel}</Text>
				</View>

				<View
					style={[
						styles.badge,
						{
							backgroundColor:
								toneColors[ticket.statusTone].backgroundColor,
						},
					]}
				>
					<Text
						style={[
							styles.badgeLabel,
							{
								color:
									toneColors[ticket.statusTone].textColor,
							},
						]}
					>
						{ticket.statusLabel}
					</Text>
				</View>
			</View>

			{ticket.amountLabel && (
				<Text style={styles.amount}>{ticket.amountLabel}</Text>
			)}

			{ticket.paymentMethod && (
				<Text style={styles.paymentMethod}>
					Paiement : {ticket.paymentMethod}
				</Text>
			)}

			{ticket.lineItems?.length ? (
				<View style={styles.itemsBlock}>
					{ticket.lineItems.slice(0, 3).map((line, index) => {
						const amount = formatLineAmount(
							line.amountCents,
							ticket.currency
						);

						return (
							<View
								key={`${ticket.id}_${line.label}_${index}`}
								style={styles.lineItem}
							>
								<Text style={styles.lineLabel}>{line.label}</Text>

								{amount ? (
									<Text style={styles.lineAmount}>{amount}</Text>
								) : null}
							</View>
						);
					})}

					{ticket.lineItems.length > 3 && (
						<Text style={styles.moreItems}>
							+ {ticket.lineItems.length - 3} lignes
						</Text>
					)}
				</View>
			) : null}

			{ticket.rejectionReason && (
				<Text style={styles.rejection}>
					{ticket.status === "FAILED" ? "Détail technique" : "Raison"} : {ticket.rejectionReason}
				</Text>
			)}
		</View>
	);

	const renderArchiveRow = (ticket: TicketHistoryItemVM) => (
		<View key={ticket.id} style={styles.archiveRow}>
			<View style={styles.archiveMain}>
				<Text style={styles.archiveMerchant}>
					{ticket.merchantName}
				</Text>
				<Text style={styles.archiveDate}>{ticket.dateLabel}</Text>
			</View>

			<View style={styles.archiveMeta}>
				{ticket.amountLabel ? (
					<Text style={styles.archiveAmount}>{ticket.amountLabel}</Text>
				) : null}
				<Text
					style={[
						styles.archiveStatus,
						{ color: toneColors[ticket.statusTone].textColor },
					]}
				>
					{ticket.statusLabel}
				</Text>
			</View>
		</View>
	);

	return (
		<ProfileCard
			title="Mes tickets"
			subtitle={`${summary.totalCount} scan(s), ${summary.confirmedCount} validé(s), ${summary.pendingCount} en cours`}
		>
			{isLoading ? (
				<View style={styles.emptyState}>
					<ActivityIndicator accessibilityLabel="Chargement de l’historique" color={palette.accent} />
					<Text style={styles.emptyTitle}>Chargement de l’historique…</Text>
				</View>
			) : isEmpty ? (
				<View style={styles.emptyState}>
					<Text accessibilityRole={error ? "alert" : "header"} style={styles.emptyTitle}>{error ? "Historique indisponible" : "Aucun ticket dans ton historique"}</Text>

					<Text style={styles.emptySubtitle}>
						Les tickets servent de preuves pour certains niveaux du Pass,
						mais tu peux partager une expérience sans ticket.
					</Text>
					{error ? (
						<Pressable onPress={refresh} style={styles.loadMoreButton} accessibilityRole="button" accessibilityLabel="Actualiser les tickets">
							<Text style={styles.retryAction}>Réessayer</Text>
						</Pressable>
					) : null}
				</View>
			) : (
				<View style={styles.list}>
					{error ? (
						<View style={styles.errorBanner}>
							<Text accessibilityRole="alert" style={styles.errorText}>Actualisation indisponible — données enregistrées affichées.</Text>
							<Pressable onPress={refresh} style={styles.loadMoreButton} accessibilityRole="button" accessibilityLabel="Actualiser les tickets">
								<Text style={styles.retryAction}>Actualiser</Text>
							</Pressable>
						</View>
					) : null}
					<View style={styles.summaryRow}>
						<Text style={styles.summaryMetric}>{summary.confirmedCount} validés</Text>
						<Text style={styles.summaryMetric}>{summary.pendingCount} en cours</Text>
						{summary.rejectedCount > 0 ? (
							<Text style={styles.summaryMetric}>{summary.rejectedCount} refusés</Text>
						) : null}
						{summary.failedCount > 0 ? (
							<Text style={styles.summaryMetric}>{summary.failedCount} à relancer</Text>
						) : null}
					</View>

					<Text style={styles.sectionLabel}>Derniers scans</Text>
					{recentItems.map(renderTicketCard)}

					{archiveCount > 0 || hasMore ? (
						<View style={styles.archiveBlock}>
							<Pressable
								onPress={() => setArchiveExpanded((value) => !value)}
								style={({ pressed }) => [
									styles.archiveToggle,
									pressed && styles.pressed,
								]}
								accessibilityRole="button"
								accessibilityState={{ expanded: archiveExpanded }}
								accessibilityLabel={
									archiveExpanded
										? "Masquer les anciens tickets"
										: `Afficher ${archiveCount} anciens tickets`
								}
							>
								<View>
									<Text style={styles.archiveTitle}>Archives</Text>
									<Text style={styles.archiveSubtitle}>
										{archiveCount} ancien(s) scan(s)
									</Text>
								</View>
								<Text style={styles.archiveAction}>
									{archiveExpanded ? "Masquer" : "Voir"}
								</Text>
							</Pressable>

							{archiveExpanded ? (
								<View style={styles.archiveList}>
									{archivedItems.map(renderArchiveRow)}
									{hasMore ? (
										<Pressable
											onPress={loadMore}
											disabled={isLoadingMore}
											accessibilityLabel="Charger la suite des tickets"
											accessibilityState={{ disabled: isLoadingMore, busy: isLoadingMore }}
											style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}
											accessibilityRole="button"
										>
											<Text style={styles.retryAction}>
												{isLoadingMore ? "Chargement…" : "Charger la suite"}
											</Text>
										</Pressable>
									) : null}
								</View>
							) : null}
						</View>
					) : null}
				</View>
			)}
		</ProfileCard>
	);
}

const styles = StyleSheet.create({
	emptyState: {
		gap: 12,
	},

	emptyTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	emptySubtitle: {
		fontSize: 14,
		color: palette.textSecondary,
		lineHeight: 20,
	},

	errorBanner: {
		borderRadius: 10,
		backgroundColor: palette.elevated,
		padding: 10,
		gap: 6,
	},

	errorText: {
		fontSize: 13,
		color: palette.textSecondary,
	},

	retryAction: {
		fontSize: 14,
		fontWeight: "700",
		color: palette.textPrimary,
	},

	loadMoreButton: {
		minHeight: 44,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 10,
	},

	list: {
		gap: 14,
	},

	summaryRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},

	summaryMetric: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: palette.surface,
		borderColor: palette.border,
		fontSize: 12,
		fontWeight: "700",
		color: palette.textSecondary,
	},

	sectionLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: palette.textSecondary,
		textTransform: "uppercase",
		letterSpacing: 0,
	},

	ticketCard: {
		borderRadius: 12,
		borderColor: palette.border,
		padding: 12,
		gap: 8,
		backgroundColor: palette.surface,
	},

	ticketHeader: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		alignItems: "flex-start",
		gap: 12,
	},

	ticketTitleBlock: {
		flex: 1,
		gap: 2,
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
		paddingHorizontal: 10,
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
		color: palette.textPrimary,
	},

	paymentMethod: {
		fontSize: 13,
		color: palette.textSecondary,
	},

	itemsBlock: {
		borderTopWidth: 1,
		borderTopColor: palette.border,
		paddingTop: 8,
		gap: 4,
	},

	lineItem: {
		flexDirection: "row",
		flexWrap: "wrap",
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
		color: palette.textSecondary,
		fontStyle: "italic",
	},

	rejection: {
		fontSize: 13,
		color: palette.danger,
		fontWeight: "500",
	},

	archiveBlock: {
		borderRadius: 12,
		borderColor: palette.border,
		overflow: "hidden",
		backgroundColor: palette.surface,
	},

	archiveToggle: {
		minHeight: 44,
		padding: 12,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},

	pressed: {
		opacity: 0.75,
	},

	archiveTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: palette.textPrimary,
	},

	archiveSubtitle: {
		fontSize: 12,
		color: palette.textSecondary,
	},

	archiveAction: {
		fontSize: 13,
		fontWeight: "700",
		color: palette.accent,
	},

	archiveList: {
		borderTopWidth: 1,
		borderTopColor: palette.border,
	},

	archiveRow: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: palette.border,
	},

	archiveMain: {
		flex: 1,
		gap: 2,
	},

	archiveMerchant: {
		fontSize: 14,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	archiveDate: {
		fontSize: 12,
		color: palette.textSecondary,
	},

	archiveMeta: {
		alignItems: "flex-end",
		gap: 2,
	},

	archiveAmount: {
		fontSize: 13,
		fontWeight: "700",
		color: palette.textPrimary,
		fontVariant: ["tabular-nums"],
	},

	archiveStatus: {
		fontSize: 12,
		fontWeight: "700",
	},
});
