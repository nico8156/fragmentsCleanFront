import { useEffect, useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Constants from "expo-constants";

import { ProfileCard } from "@/app/adapters/primary/react/features/profile/components/ProfileCard";
import { AccountActions } from "../components/AccountActions";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";
import { ReleaseLegalLinks } from "@/app/adapters/primary/react/components/ReleaseLegalLinks";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import { useOnBoarding } from "@/app/adapters/secondary/viewModel/useOnBoarding";
import type { RootStateWl } from "@/app/store/reduxStoreWl";
import { blockedUsersRetrieval } from "@/app/core-logic/contextWL/commentWl/usecases/read/blockedUsersRetrieval";
import { uiUserUnblockRequested } from "@/app/core-logic/contextWL/commentWl/usecases/write/commentModerationWlUseCase";
import { selectBlockedUsers } from "@/app/core-logic/contextWL/commentWl/selector/commentWl.selector";

export function AppSettingsScreen() {
	const dispatch=useDispatch<any>();
	const blockedUsers=useSelector(selectBlockedUsers);
	const blockedLoading=useSelector((state:RootStateWl)=>state.cState.blockedUsersLoading);
	const blockedUsersError=useSelector((state:RootStateWl)=>state.cState.blockedUsersError);
	const supportEmail=Constants.expoConfig?.extra?.supportEmail as string | undefined;
	useEffect(()=>{ dispatch(blockedUsersRetrieval()); },[dispatch]);
	const {
		isSignedIn, signOut,
		deleteAccount, accountDeletionStatus, accountDeletionError,
	} =
		useAuthUser();


	const statusLabel = useMemo(
		() => (isSignedIn ? "Connecté" : "Hors connexion"),
		[isSignedIn]
	);

	const { markHasNOTCompletedOnboarding } = useOnBoarding();
	const deleting = accountDeletionStatus === "submitting";

	return (
		<ProfileLayout>

			<ProfileCard title="Préférences">
				<View style={styles.row}>
					<View>
						<Text style={styles.rowTitle}>Statut</Text>
						<Text style={styles.rowSubtitle}>{statusLabel}</Text>
					</View>
				</View>
			</ProfileCard>

			<ProfileCard title="Sécurité et communauté">
				<Text style={styles.rowSubtitle}>Les contenus haineux, violents, sexuels, trompeurs, harcelants ou assimilables à du spam ne sont pas autorisés.</Text>
				{blockedUsers.map(user => <View key={user.userId} style={styles.row}>
					<View style={{ flex: 1 }}><Text style={styles.rowTitle}>{user.displayName || "Utilisateur bloqué"}</Text><Text style={styles.rowSubtitle}>Ses contenus sont masqués</Text></View>
					<Pressable style={styles.supportLink} accessibilityRole="button" accessibilityLabel={`Débloquer ${user.displayName || "cet utilisateur"}`} onPress={()=>dispatch(uiUserUnblockRequested({userId:user.userId}))}><Text style={styles.link}>Débloquer</Text></Pressable>
				</View>)}
				{blockedUsers.length===0 ? <Text style={styles.rowSubtitle}>{blockedLoading === "PENDING" ? "Chargement…" : "Aucun utilisateur bloqué."}</Text> : null}
				{blockedUsersError ? <Text accessibilityRole="alert" style={styles.error}>{blockedUsersError}</Text> : null}
				{supportEmail ? <Pressable accessibilityRole="link" onPress={()=>Linking.openURL(`mailto:${supportEmail}`)} style={styles.supportLink}>
					<Text style={styles.link}>Contacter le support</Text>
				</Pressable> : null}
				<ReleaseLegalLinks color={palette.textSecondary} />
			</ProfileCard>

			<AccountActions isSignedIn={isSignedIn} deleting={deleting} accountDeletionError={accountDeletionError}
				markHasNOTCompletedOnboarding={markHasNOTCompletedOnboarding} signOut={signOut} deleteAccount={deleteAccount} />
		</ProfileLayout>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, paddingVertical: 8 },
	rowTitle: { fontSize: 16, lineHeight: 22, fontWeight: "600", color: palette.textPrimary },
	rowSubtitle: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
	link: { color: palette.accent, fontSize: 14 },
	supportLink: { minHeight: 44, justifyContent: "center", marginTop: 8 },
	error: { color: palette.danger },
});
export default AppSettingsScreen;
