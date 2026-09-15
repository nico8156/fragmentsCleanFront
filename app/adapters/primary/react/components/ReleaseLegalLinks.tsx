import { Alert, Linking, Pressable, Text, View } from "react-native";
import { useReleaseLinks } from "@/app/adapters/secondary/viewModel/useReleaseLinks";

export function ReleaseLegalLinks({ color = "#343434" }: { color?: string }) {
	const { privacyPolicyUrl, termsUrl } = useReleaseLinks();
	const open = (url: string) => {
		void Linking.openURL(url).catch(() => Alert.alert("Lien indisponible", "Réessaie lorsque ta connexion est disponible."));
	};
	return <View style={{ gap: 4, alignItems: "center" }}>
		{[
			{ label: "Politique de confidentialité", url: privacyPolicyUrl },
			{ label: "Conditions d’utilisation", url: termsUrl },
		].map(({ label, url }) => url ? <Pressable key={label} accessibilityRole="link"
			onPress={() => open(url)} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}>
			<Text style={{ color, textDecorationLine: "underline", textAlign: "center" }}>{label}</Text>
		</Pressable> : null)}
	</View>;
}
