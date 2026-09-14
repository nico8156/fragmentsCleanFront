import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";

export function ExperiencePhoto({ uri, label }: { uri?: string; label: string }) {
	const [failedUri, setFailedUri] = useState<string>();
	if (!uri || failedUri === uri) {
		return <View style={styles.unavailable}><Text style={styles.message}>L’aperçu de la photo n’est pas disponible.</Text></View>;
	}
	return <Image source={{ uri }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" accessibilityLabel={label} onError={() => setFailedUri(uri)} />;
}

const styles = StyleSheet.create({
	image: { width: "100%", height: 176, borderRadius: 14, backgroundColor: palette.elevated },
	unavailable: { padding: 16, borderRadius: 14, backgroundColor: palette.elevated },
	message: { color: palette.textSecondary, fontSize: 13, lineHeight: 18 },
});
