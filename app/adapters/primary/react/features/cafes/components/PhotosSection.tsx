import { palette } from "@/app/adapters/primary/react/css/colors";
import { Image } from "expo-image";
import React, { useState } from "react";
import { FlatList, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { radii, spacing as space, typography } from "@/app/adapters/primary/react/css/designTokens";

export function PhotosSection({ photos }: { photos: string[] }) {
	const [containerWidth, setContainerWidth] = useState<number>(0);

	const onLayout = (e: LayoutChangeEvent) => {
		const w = Math.floor(e.nativeEvent.layout.width);
		if (w && w !== containerWidth) setContainerWidth(w);
	};

	const itemWidth = containerWidth;
	const snapInterval = itemWidth + space.micro;

	return (
		<View style={s.section}>
			<View onLayout={onLayout} style={s.carouselWrap}>
				{/* On attend de connaître la largeur pour éviter un premier rendu “trop large” */}
				{photos.length === 0 ? <View style={s.empty}><Text style={s.photoEmptyText}>Aucune photo pour le moment</Text></View> : containerWidth > 0 ? (
					<FlatList
						data={photos}
						keyExtractor={(uri, idx) => `${uri}-${idx}`}
						horizontal
						showsHorizontalScrollIndicator={false}
						decelerationRate="fast"
						snapToInterval={snapInterval}
						snapToAlignment="start"
						disableIntervalMomentum
						ItemSeparatorComponent={() => <View style={{ width: space.micro }} />}
						renderItem={({ item, index }) => (
							<View style={[s.photoFrame, { width: itemWidth }]}>
								<Image source={item} style={s.photo} contentFit="cover" cachePolicy="memory-disk" accessibilityLabel={`Photo du café ${index + 1} sur ${photos.length}`} />
							</View>
						)}
					/>
				) : (
					<View style={[s.photoFrame, s.photoEmpty, { width: "100%" }]}>
						<Text style={s.photoEmptyText}>Chargement…</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	section: { paddingHorizontal: space.standard },
	carouselWrap: { paddingTop: 0 },
	empty: { paddingVertical: space.standard },

	photoFrame: {
		aspectRatio: 4 / 3,
		borderRadius: radii.card,
		overflow: "hidden",
		backgroundColor: palette.elevated,
	},
	photo: { width: "100%", height: "100%" },

	photoEmpty: { alignItems: "center", justifyContent: "center" },
	photoEmptyText: { ...typography.body, color: palette.textMuted },
});
