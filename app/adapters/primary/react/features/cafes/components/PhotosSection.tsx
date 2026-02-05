import { palette } from "@/app/adapters/primary/react/css/colors";
import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Section } from "./Section";

export function PhotosSection({ photos }: { photos: string[] }) {
	return (
		<Section title="Photos">
			<View style={s.carouselWrap}>
				<FlatList
					data={photos}
					keyExtractor={(uri, idx) => `${uri}-${idx}`}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
					renderItem={({ item }) => <Image source={{ uri: item }} style={s.photo} />}
					ListEmptyComponent={
						<View style={[s.photo, s.photoEmpty]}>
							<Text style={s.photoEmptyText}>Aucune photo</Text>
						</View>
					}
				/>
			</View>
		</Section>
	);
}

const s = StyleSheet.create({
	carouselWrap: { paddingTop: 2 },
	photo: {
		width: 280,
		height: 190,
		borderRadius: 18,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	photoEmpty: { alignItems: "center", justifyContent: "center" },
	photoEmptyText: { color: palette.textMuted, fontWeight: "800" },
});

