import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useStudioArticleEditor } from "@/app/adapters/secondary/viewModel/useStudioArticleEditor";
import { useStudioCafes } from "@/app/adapters/secondary/viewModel/useStudioCafes";

type StudioTab = "cafes" | "articles";

export function StudioScreen() {
	const [tab, setTab] = useState<StudioTab>("cafes");

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Fragments Studio</Text>
				<View style={styles.nav}>
					<NavButton active={tab === "cafes"} label="Cafés" icon="cafe-outline" onPress={() => setTab("cafes")} />
					<NavButton active={tab === "articles"} label="Articles" icon="newspaper-outline" onPress={() => setTab("articles")} />
				</View>
			</View>
			{tab === "cafes" ? <StudioCafesPanel /> : <StudioArticlesPanel />}
		</View>
	);
}

function NavButton(props: { active: boolean; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
	return (
		<Pressable onPress={props.onPress} style={[styles.navButton, props.active && styles.navButtonActive]}>
			<Ionicons name={props.icon} size={18} color={props.active ? palette.background : palette.textSecondary} />
			<Text style={[styles.navText, props.active && styles.navTextActive]}>{props.label}</Text>
		</Pressable>
	);
}

function StudioCafesPanel() {
	const vm = useStudioCafes();

	return (
		<ScrollView contentContainerStyle={styles.panel}>
			<Field label="Token admin" value={vm.adminToken} onChangeText={vm.setAdminToken} secureTextEntry />
			<Pressable style={styles.primaryButton} onPress={vm.refresh}>
				<Ionicons name="refresh" size={18} color={palette.background} />
				<Text style={styles.primaryButtonText}>Rafraîchir les cafés</Text>
			</Pressable>
			{vm.status === "pending" ? <ActivityIndicator color={palette.accent} /> : null}
			{vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
			<View style={styles.list}>
				{vm.cafes.map((cafe) => (
					<View key={cafe.id} style={styles.row}>
						{cafe.photoUri ? <Image source={cafe.photoUri} style={styles.rowImage} contentFit="cover" /> : <View style={styles.rowImageFallback} />}
						<View style={styles.rowBody}>
							<Text style={styles.rowTitle}>{cafe.name}</Text>
							<Text style={styles.rowMeta}>{cafe.city ?? cafe.id}</Text>
						</View>
					</View>
				))}
			</View>
		</ScrollView>
	);
}

function StudioArticlesPanel() {
	const vm = useStudioArticleEditor();

	return (
		<ScrollView contentContainerStyle={styles.panel}>
			<Field label="Token admin" value={vm.adminToken} onChangeText={vm.setAdminToken} secureTextEntry />
			<Field label="Titre" value={vm.title} onChangeText={vm.setTitle} />
			<Field label="Slug" value={vm.slug} onChangeText={vm.setSlug} placeholder={vm.effectiveSlug || "slug-auto"} />
			<Field label="Introduction" value={vm.intro} onChangeText={vm.setIntro} multiline />
			<Field label="Conclusion" value={vm.conclusion} onChangeText={vm.setConclusion} multiline />
			<Field label="Tags" value={vm.tagsText} onChangeText={vm.setTagsText} placeholder="coffee, rennes, guide" />
			<Field label="Cafés liés" value={vm.coffeeIdsText} onChangeText={vm.setCoffeeIdsText} placeholder="uuid, uuid" />

			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Couverture</Text>
				<Pressable style={styles.iconButton} onPress={() => vm.pickAndUploadImage({ kind: "cover" })}>
					<Ionicons name="cloud-upload-outline" size={19} color={palette.textPrimary} />
				</Pressable>
				{vm.lastImage ? (
					<Pressable style={styles.iconButton} onPress={vm.applyLastUploadedAsCover}>
						<Ionicons name="checkmark" size={19} color={palette.success} />
					</Pressable>
				) : null}
			</View>
			{vm.cover?.url ? <Image source={vm.cover.url} style={styles.coverPreview} contentFit="cover" /> : null}

			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Blocs</Text>
				<Pressable style={styles.iconButton} onPress={vm.addBlock}>
					<Ionicons name="add" size={20} color={palette.textPrimary} />
				</Pressable>
			</View>
			{vm.blocks.map((block, index) => (
				<View key={index} style={styles.block}>
					<View style={styles.blockTop}>
						<Text style={styles.blockTitle}>Bloc {index + 1}</Text>
						<Pressable style={styles.iconButton} onPress={() => vm.removeBlock(index)}>
							<Ionicons name="trash-outline" size={18} color={palette.danger} />
						</Pressable>
					</View>
					<Field label="Intertitre" value={block.heading} onChangeText={(heading) => vm.updateBlock(index, { heading })} />
					<Field label="Paragraphe" value={block.paragraph} onChangeText={(paragraph) => vm.updateBlock(index, { paragraph })} multiline />
					<View style={styles.blockTop}>
						<Pressable style={styles.secondaryButton} onPress={() => vm.pickAndUploadImage({ kind: "block", index })}>
							<Ionicons name="image-outline" size={17} color={palette.textPrimary} />
							<Text style={styles.secondaryButtonText}>Uploader</Text>
						</Pressable>
						{vm.lastImage ? (
							<Pressable style={styles.secondaryButton} onPress={() => vm.applyLastUploadedToBlock(index)}>
								<Ionicons name="checkmark" size={17} color={palette.success} />
								<Text style={styles.secondaryButtonText}>Utiliser</Text>
							</Pressable>
						) : null}
					</View>
					{block.photo?.url ? <Image source={block.photo.url} style={styles.blockImage} contentFit="cover" /> : null}
				</View>
			))}

			<Pressable style={[styles.primaryButton, !vm.canSubmit && styles.disabledButton]} disabled={!vm.canSubmit} onPress={vm.submit}>
				<Ionicons name="send" size={18} color={palette.background} />
				<Text style={styles.primaryButtonText}>Publier l'article</Text>
			</Pressable>
			{vm.isSubmitting || vm.isUploadingImage ? <ActivityIndicator color={palette.accent} /> : null}
			{vm.commandStatus ? <Text style={styles.status}>Commande: {vm.commandStatus}</Text> : null}
			{vm.lastSubmitted ? <Text style={styles.status}>Article: {vm.lastSubmitted.slug}</Text> : null}
			{vm.error ? <Text style={styles.error}>{vm.error}</Text> : null}
		</ScrollView>
	);
}

function Field(props: {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
	multiline?: boolean;
	secureTextEntry?: boolean;
}) {
	return (
		<View style={styles.field}>
			<Text style={styles.label}>{props.label}</Text>
			<TextInput
				value={props.value}
				onChangeText={props.onChangeText}
				placeholder={props.placeholder}
				placeholderTextColor={palette.textMuted}
				multiline={props.multiline}
				secureTextEntry={props.secureTextEntry}
				style={[styles.input, props.multiline && styles.multilineInput]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: palette.background },
	header: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.border },
	title: { color: palette.textPrimary, fontSize: 26, fontWeight: "800" },
	nav: { flexDirection: "row", gap: 8, marginTop: 18 },
	navButton: { height: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: palette.border, flexDirection: "row", alignItems: "center", gap: 8 },
	navButtonActive: { backgroundColor: palette.accent, borderColor: palette.accent },
	navText: { color: palette.textSecondary, fontWeight: "700" },
	navTextActive: { color: palette.background },
	panel: { padding: 18, gap: 14, paddingBottom: 48 },
	field: { gap: 7 },
	label: { color: palette.textSecondary, fontSize: 13, fontWeight: "700" },
	input: { minHeight: 44, borderWidth: 1, borderColor: palette.border, borderRadius: 8, color: palette.textPrimary, paddingHorizontal: 12, backgroundColor: palette.surface },
	multilineInput: { minHeight: 104, paddingTop: 12, textAlignVertical: "top" },
	primaryButton: { height: 46, borderRadius: 8, backgroundColor: palette.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
	primaryButtonText: { color: palette.background, fontWeight: "800" },
	disabledButton: { opacity: 0.5 },
	secondaryButton: { height: 36, borderRadius: 8, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7 },
	secondaryButtonText: { color: palette.textPrimary, fontWeight: "700" },
	iconButton: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center" },
	sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
	sectionTitle: { color: palette.textPrimary, fontSize: 18, fontWeight: "800", flex: 1 },
	coverPreview: { height: 190, borderRadius: 8, backgroundColor: palette.surface },
	block: { borderWidth: 1, borderColor: palette.border, borderRadius: 8, padding: 12, gap: 12, backgroundColor: palette.elevated },
	blockTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
	blockTitle: { color: palette.textPrimary, fontWeight: "800" },
	blockImage: { height: 150, borderRadius: 8, backgroundColor: palette.surface },
	status: { color: palette.textSecondary, fontWeight: "700" },
	error: { color: palette.danger, fontWeight: "700" },
	list: { gap: 10 },
	row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderWidth: 1, borderColor: palette.border, borderRadius: 8, backgroundColor: palette.surface },
	rowImage: { width: 58, height: 58, borderRadius: 8 },
	rowImageFallback: { width: 58, height: 58, borderRadius: 8, backgroundColor: palette.elevated },
	rowBody: { flex: 1 },
	rowTitle: { color: palette.textPrimary, fontWeight: "800" },
	rowMeta: { color: palette.textMuted, marginTop: 4 },
});

export default StudioScreen;
