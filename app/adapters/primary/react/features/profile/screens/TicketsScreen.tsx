import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { ProfileHero } from "@/app/adapters/primary/react/features/profile/components/ProfileHero";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import type { TicketHistoryItemVM } from "@/app/adapters/secondary/viewModel/useTicketsHistory";
import { useTicketsHistory } from "@/app/adapters/secondary/viewModel/useTicketsHistory";

const toneColors: Record<
	"pending" | "success" | "error",
	{ backgroundColor: string; textColor: string }
> = {
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
	const { recentItems, archivedItems, archiveCount, summary, isEmpty } = useTicketsHistory();
	const [archiveExpanded, setArchiveExpanded] = useState(false);
	const safeDisplayName = displayName ?? "Profil";

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
					Raison : {ticket.rejectionReason}
				</Text>
			)}
		</View>
	);

	const renderArchiveRow = (ticket: TicketHistoryItemVM) => (
		<View key={ticket.id} style={styles.archiveRow}>
			<View style={styles.archiveMain}>
				<Text style={styles.archiveMerchant} numberOfLines={1}>
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
		<ProfileLayout>
			<ProfileHero
				avatarUrl={avatarUrl}
				displayName={safeDisplayName}
				email={primaryEmail ?? "Non renseigné"}
			/>

			<ProfileCard
				title="Mes tickets"
				subtitle={`${summary.totalCount} scan(s), ${summary.confirmedCount} validé(s), ${summary.pendingCount} en cours`}
			>
				{isEmpty ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyTitle}>Aucun ticket actif</Text>

						<Text style={styles.emptySubtitle}>
							Scanne un justificatif depuis la section « Pass » pour alimenter
							ton historique et débloquer des récompenses.
						</Text>
					</View>
				) : (
					<View style={styles.list}>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryMetric}>{summary.confirmedCount} validés</Text>
							<Text style={styles.summaryMetric}>{summary.pendingCount} en cours</Text>
							{summary.rejectedCount > 0 ? (
								<Text style={styles.summaryMetric}>{summary.rejectedCount} refusés</Text>
							) : null}
						</View>

						<Text style={styles.sectionLabel}>Derniers scans</Text>
						{recentItems.map(renderTicketCard)}

						{archiveCount > 0 ? (
							<View style={styles.archiveBlock}>
								<Pressable
									onPress={() => setArchiveExpanded((value) => !value)}
									style={({ pressed }) => [
										styles.archiveToggle,
										pressed && styles.pressed,
									]}
									accessibilityRole="button"
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
									</View>
								) : null}
							</View>
						) : null}
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
		fontSize: 17,
		fontWeight: "600",
		color: palette.textPrimary,
	},

	emptySubtitle: {
		fontSize: 14,
		color: palette.textSecondary,
		lineHeight: 20,
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
		backgroundColor: palette.bg_dark_10,
		borderWidth: 1,
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
		borderWidth: 1,
		borderColor: palette.border,
		padding: 12,
		gap: 8,
		backgroundColor: palette.bg_dark_10,
	},

	ticketHeader: {
		flexDirection: "row",
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
		color: "#B3261E",
		fontWeight: "500",
	},

	archiveBlock: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: palette.border,
		overflow: "hidden",
		backgroundColor: palette.bg_dark_10,
	},

	archiveToggle: {
		padding: 12,
		flexDirection: "row",
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
		color: palette.primary_90,
	},

	archiveList: {
		borderTopWidth: 1,
		borderTopColor: palette.border,
	},

	archiveRow: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		flexDirection: "row",
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

export default TicketsScreen;
