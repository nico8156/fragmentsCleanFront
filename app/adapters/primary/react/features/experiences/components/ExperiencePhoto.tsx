import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii } from "@/app/adapters/primary/react/css/designTokens";
import { palette } from "@/app/adapters/primary/react/css/colors";

export function ExperiencePhoto({ uri, label, mediaId, compact = false }: { uri?: string; label: string; mediaId?: string; compact?: boolean }) {
	const [failedUri, setFailedUri] = useState<string>();
	if (!uri || failedUri === uri) {
		return <View style={styles.unavailable}><Text style={styles.message}>L’aperçu de la photo n’est pas disponible.</Text></View>;
	}
	const cacheKey = mediaId && /^https?:/.test(uri) ? `experience-media:${mediaId}` : undefined;
	return <Image source={{ uri, cacheKey }} style={[styles.image, compact && styles.compact]} contentFit="cover" cachePolicy="memory-disk" accessibilityLabel={label} onError={() => setFailedUri(uri)} />;
}

const styles = StyleSheet.create({
	image: { width: "100%", aspectRatio: 4 / 3, borderRadius: radii.card, backgroundColor: palette.elevated },
	compact: { height: 108, aspectRatio: undefined, borderRadius: 0 },
	unavailable: { padding: 16, borderRadius: 14, backgroundColor: palette.elevated },
	message: { color: palette.textSecondary, fontSize: 13, lineHeight: 18 },
});
