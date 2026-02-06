import { palette } from "@/app/adapters/primary/react/css/colors";
import React, { useMemo, useState } from "react";
import { FlatList, Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Section } from "./Section";

export function PhotosSection({ photos }: { photos: string[] }) {
	const [containerWidth, setContainerWidth] = useState<number>(0);

	const onLayout = (e: LayoutChangeEvent) => {
		const w = Math.floor(e.nativeEvent.layout.width);
		if (w && w !== containerWidth) setContainerWidth(w);
	};

	const spacing = 10;
	const sideGutter = 10; // petit air à gauche/droite à l’intérieur de la card

	const itemWidth = useMemo(() => {
		if (!containerWidth) return 280; // fallback
		// ✅ largeur réelle dispo dans la card
		const w = containerWidth - sideGutter * 2;
		return Math.max(240, w); // garde un minimum
	}, [containerWidth]);

	const snapInterval = itemWidth + spacing;

	return (
		<Section title="Photos">
			<View onLayout={onLayout} style={s.carouselWrap}>
				{/* On attend de connaître la largeur pour éviter un premier rendu “trop large” */}
				{containerWidth > 0 ? (
					<FlatList
						data={photos}
						keyExtractor={(uri, idx) => `${uri}-${idx}`}
						horizontal
						showsHorizontalScrollIndicator={false}
						decelerationRate="fast"
						snapToInterval={snapInterval}
						snapToAlignment="start"
						disableIntervalMomentum
						contentContainerStyle={{
							paddingLeft: sideGutter,
							paddingRight: sideGutter,
						}}
						ItemSeparatorComponent={() => <View style={{ width: spacing }} />}
						renderItem={({ item }) => (
							<View style={[s.photoFrame, { width: itemWidth }]}>
								<Image source={{ uri: item }} style={s.photo} />
							</View>
						)}
						ListEmptyComponent={
							<View style={[s.photoFrame, s.photoEmpty, { width: itemWidth }]}>
								<Text style={s.photoEmptyText}>Aucune photo</Text>
							</View>
						}
					/>
				) : (
					<View style={[s.photoFrame, s.photoEmpty, { width: "100%" }]}>
						<Text style={s.photoEmptyText}>Chargement…</Text>
					</View>
				)}
			</View>
		</Section>
	);
}

const s = StyleSheet.create({
	carouselWrap: { paddingTop: 2 },

	photoFrame: {
		height: 250,
		borderRadius: 18,
		overflow: "hidden",
		backgroundColor: palette.elevated,
	},
	photo: { width: "100%", height: "100%" },

	photoEmpty: { alignItems: "center", justifyContent: "center" },
	photoEmptyText: { color: palette.textMuted, fontWeight: "800" },
});

