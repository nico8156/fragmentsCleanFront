import { palette } from "@/app/adapters/primary/react/css/colors";
import CoffeeListItem from "@/app/adapters/primary/react/features/map/components/coffeeSelection/coffeeListItem";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { selectCoffeesList } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSelector } from "react-redux";

const MIN_QUERY = 3;

export function SearchScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const coffees = useSelector(selectCoffeesList);

	const [query, setQuery] = useState("");

	const normalized = useMemo(() => query.trim().toLowerCase(), [query]);
	const isActiveSearch = normalized.length >= MIN_QUERY;

	const filteredIds = useMemo(() => {
		if (!isActiveSearch) return [];

		return coffees
			.filter((coffee) => {
				const name = coffee?.name?.toLowerCase() ?? "";
				const city = coffee?.address?.city?.toLowerCase() ?? "";
				const address = coffee?.address?.line1?.toLowerCase() ?? "";
				return (
					name.includes(normalized) ||
					city.includes(normalized) ||
					address.includes(normalized)
				);
			})
			.map((coffee) => coffee?.id)
			.filter(Boolean)
			.map((id) => String(id));
	}, [coffees, isActiveSearch, normalized]);

	const onBack = useCallback(() => {
		Keyboard.dismiss();
		navigation.goBack();
	}, [navigation]);

	const onClear = useCallback(() => {
		setQuery("");
	}, []);

	const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
			>
				{/* Header */}
				<View style={styles.header}>
					<Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" hitSlop={10}>
						<Ionicons name="chevron-back" size={22} color={palette.textPrimary} />
					</Pressable>

					<View style={styles.searchField}>
						<Ionicons name="search" size={18} color={palette.textMuted} />
						<TextInput
							value={query}
							onChangeText={setQuery}
							placeholder="Rechercher un café"
							placeholderTextColor={palette.textMuted}
							style={styles.input}
							autoFocus
							autoCorrect={false}
							autoCapitalize="none"
							returnKeyType="search"
							clearButtonMode="never"
							onSubmitEditing={dismissKeyboard}
						/>

						{query.length > 0 ? (
							<Pressable onPress={onClear} style={styles.clearButton} accessibilityRole="button" hitSlop={10}>
								<Ionicons name="close" size={18} color={palette.textMuted} />
							</Pressable>
						) : null}
					</View>
				</View>

				{/* Content */}
				{!isActiveSearch ? (
					<Pressable style={styles.emptyContainer} onPress={dismissKeyboard}>
						<View style={styles.emptyCard}>
							<Text style={styles.emptyTitle}>Rechercher un café</Text>
							<Text style={styles.emptyText}>
								Commence à taper — les résultats apparaîtront à partir de {MIN_QUERY} caractères.
							</Text>

							{/* petits “chips” optionnels, neutres */}
							<View style={styles.hintsRow}>
								<View style={styles.hintChip}>
									<Text style={styles.hintText}>nom</Text>
								</View>
								<View style={styles.hintChip}>
									<Text style={styles.hintText}>ville</Text>
								</View>
								<View style={styles.hintChip}>
									<Text style={styles.hintText}>adresse</Text>
								</View>
							</View>
						</View>
					</Pressable>
				) : (
					<>
						{/* Meta */}
						<View style={styles.meta}>
							<Text style={styles.metaLabel}>Résultats</Text>
							<Text style={styles.metaValue}>{filteredIds.length}</Text>
						</View>

						<FlatList
							data={filteredIds}
							keyExtractor={(id) => id}
							keyboardShouldPersistTaps="handled"
							keyboardDismissMode="on-drag"
							contentContainerStyle={styles.listContent}
							ItemSeparatorComponent={() => <View style={styles.separator} />}
							renderItem={({ item }) => (
								<Pressable onPress={dismissKeyboard}>
									<CoffeeListItem id={parseToCoffeeId(String(item))} />
								</Pressable>
							)}
							ListEmptyComponent={
								<View style={styles.noResults}>
									<Text style={styles.noResultsTitle}>Aucun résultat</Text>
									<Text style={styles.noResultsText}>
										Essaie un autre nom, ou une ville proche.
									</Text>
								</View>
							}
						/>
					</>
				)}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },

	safeArea: {
		flex: 1,
		backgroundColor: palette.background,
	},

	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 10,
		gap: 12,
	},

	backButton: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(36, 27, 22, 0.72)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.secondary_90,
	},

	searchField: {
		flex: 1,
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 14,
		borderRadius: 16,
		backgroundColor: palette.elevated,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.border,
	},

	input: {
		flex: 1,
		color: palette.textPrimary,
		fontSize: 16,
		paddingVertical: 10,
	},

	clearButton: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},

	meta: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingTop: 10,
		paddingBottom: 10,
	},
	metaLabel: {
		color: palette.textMuted,
		fontSize: 13,
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	metaValue: {
		color: palette.textPrimary,
		fontSize: 16,
		fontWeight: "700",
	},

	listContent: {
		paddingHorizontal: 16,
		paddingBottom: 24,
	},
	separator: {
		height: 12,
	},

	emptyContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 18,
	},
	emptyCard: {
		borderRadius: 18,
		backgroundColor: "rgba(33, 24, 19, 0.35)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: palette.secondary_90,
		padding: 18,
	},
	emptyTitle: {
		color: palette.textPrimary,
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 6,
	},
	emptyText: {
		color: palette.textMuted,
		fontSize: 14,
		lineHeight: 20,
	},
	hintsRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 14,
	},
	hintChip: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "rgba(36, 27, 22, 0.55)",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.06)",
	},
	hintText: {
		color: palette.textMuted,
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},

	noResults: {
		paddingHorizontal: 8,
		paddingTop: 24,
	},
	noResultsTitle: {
		color: palette.textPrimary,
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 6,
	},
	noResultsText: {
		color: palette.textMuted,
		fontSize: 14,
		lineHeight: 20,
	},
});

export default SearchScreen;
