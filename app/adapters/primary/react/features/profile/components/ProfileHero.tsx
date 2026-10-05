import { FragmentsButton } from "@/app/adapters/primary/react/components/design/Primitives";
import { spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { PassAvatar } from "@/app/adapters/primary/react/features/pass/components/PassAvatar";
import type { PassRingViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { StyleSheet, Text, View } from "react-native";

interface ProfileHeroProps {
	avatarUrl?: string;
	displayName?: string;
	email?: string;
	rings?: PassRingViewModel[];
	onEdit?: () => void;
	syncing?: boolean;
	error?: string;
}

export function ProfileHero({ avatarUrl, displayName, email, rings = [], onEdit, syncing, error }: ProfileHeroProps) {
	const safeDisplayName = displayName?.trim() || "Utilisateur";
	const fallbackInitial = (safeDisplayName.trim()?.[0] ?? "?").toUpperCase();

	return (
		<View style={styles.wrapper}>
			<PassAvatar
				imageUrl={avatarUrl}
				rings={rings}
				size={80}
				fallbackInitial={fallbackInitial}
				accessibilityLabel={`${safeDisplayName}, progression Pass actuelle`}
			/>

			<Text accessibilityRole="header" style={styles.name}>{safeDisplayName}</Text>
			{email ? <Text style={styles.email}>{email}</Text> : null}
			{syncing ? <Text accessibilityLiveRegion="polite" style={styles.email}>Profil en cours de synchronisation…</Text> : null}
			{error ? <Text accessibilityRole="alert" style={styles.email}>{error}</Text> : null}
			{onEdit ? <FragmentsButton label="Modifier mon profil" variant="tertiary" onPress={onEdit} /> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: { alignItems: "center", gap: spacing.micro, paddingVertical: spacing.compact },
	name: { ...typography.screen, color: palette.textPrimary, textAlign: "center", alignSelf: "stretch" },
	email: { ...typography.body, color: palette.textSecondary, textAlign: "center", alignSelf: "stretch" },
});
