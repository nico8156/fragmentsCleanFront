import { palette } from "@/app/adapters/primary/react/css/colors";
import { radii, spacing, typography } from "@/app/adapters/primary/react/css/designTokens";
import { CompactCard, ContentState, SectionHeader } from "@/app/adapters/primary/react/components/design/Primitives";
import type { ArticlePreviewVM } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import type { HomeContentVM } from "@/app/adapters/secondary/viewModel/homeContentViewModel";
import type { DiscoveryCoffeeVM } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { ExperiencePhoto } from "../../experiences/components/ExperiencePhoto";

export function HomeContentSections({ content, onOpenMap, onOpenScan, onOpenCoffee, onOpenArticle, onOpenArticleCatalogue, onOpenExperiences, onOpenPass }: {
	content: HomeContentVM;
	onOpenMap: () => void;
	onOpenScan: () => void;
	onOpenCoffee: (id: string) => void;
	onOpenArticle: (slug: string) => void;
	onOpenArticleCatalogue: () => void;
	onOpenExperiences: () => void;
	onOpenPass: () => void;
}) {
	return (
		<View style={styles.content}>
			<Section title={content.coffeeTitle} action="Voir la carte" onAction={onOpenMap}>
				{content.coffees.length ? (
					<HorizontalRail label="Cafés à découvrir">
						{content.coffees.map((coffee) => <CoffeeCard key={String(coffee.id)} coffee={coffee} onPress={() => onOpenCoffee(String(coffee.id))} />)}
					</HorizontalRail>
				) : <ContentState kind="empty" message="La sélection arrive ici dès que le catalogue est disponible." action="Ouvrir la carte" onAction={onOpenMap} />}
			</Section>
			<Section title="Prochaine étape" action="Voir mon Pass" onAction={onOpenPass}>
				<Pressable style={styles.passPrompt} onPress={content.pass.action === "scan" ? onOpenScan : onOpenMap} accessibilityRole="button">
					<Text style={styles.passEyebrow}>PASS FRAGMENTS</Text>
					<Text style={styles.coffeeName}>{content.pass.title}</Text>
					<Text style={styles.muted}>{content.pass.detail}</Text>
					<Text style={styles.cardAction}>{content.pass.actionLabel} ›</Text>
				</Pressable>
			</Section>
			<Section title="Tes expériences" action="Tout voir" onAction={onOpenExperiences}>
				{content.experiences.length ? (
					<HorizontalRail label="Tes expériences">
						{content.experiences.map((experience) => (
							<CompactCard key={experience.id} style={styles.experienceCard}>
								{experience.imageUrl ? <ExperiencePhoto uri={experience.imageUrl} mediaId={experience.imageMediaId} label="Photo de mon expérience" compact /> : (
									<View style={styles.experiencePlaceholder}><Text style={styles.muted}>Fragments</Text></View>
								)}
								<View style={styles.experienceBody}>
									<Text style={styles.coffeeName} numberOfLines={1}>{experience.coffeeName}</Text>
									<Text numberOfLines={2} style={styles.muted}>{experience.message}</Text>
								</View>
							</CompactCard>
						))}
					</HorizontalRail>
				) : <ContentState kind="empty" message="Raconte une visite depuis la fiche d’un café, avec ou sans ticket." action="Trouver un café" onAction={onOpenMap} />}
			</Section>
			{content.publishedArticleCount ? (
				<Section title="À lire ensuite" action="Tous les articles" onAction={onOpenArticleCatalogue}>
					{content.articles.length ? <View style={styles.list}>{content.articles.map((article) => <ArticleCard key={article.id} article={article} onPress={() => onOpenArticle(article.slug)} />)}</View> : <Text style={styles.muted}>Retrouve toutes les histoires publiées dans le catalogue.</Text>}
				</Section>
			) : null}
		</View>
	);
}

function HorizontalRail({ label, children }: { label: string; children: React.ReactNode }) {
	return <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
		contentContainerStyle={styles.railContent} style={styles.rail} accessibilityLabel={label}>
		{children}
	</ScrollView>;
}

function Section({ title, action, onAction, children }: {
	title: string; action: string; onAction: () => void; children: React.ReactNode;
}) {
	return <View style={styles.section}><SectionHeader title={title} action={action} onAction={onAction} />{children}</View>;
}

function CoffeeCard({ coffee, onPress }: { coffee: DiscoveryCoffeeVM; onPress: () => void }) {
	return (
		<CompactCard style={styles.coffeeCard} onPress={onPress}>
			<View style={styles.coffeeCopy}>
				<Text style={styles.coffeeName} numberOfLines={2}>{coffee.name}</Text>
				<Text style={styles.muted} numberOfLines={2}>{[coffee.city, coffee.distanceText, coffee.isOpenNow === undefined ? undefined : coffee.isOpenNow ? "Ouvert" : "Fermé"].filter(Boolean).join(" · ") || "Voir la fiche"}</Text>
			</View>
			<Text style={styles.chevron} accessibilityElementsHidden>›</Text>
		</CompactCard>
	);
}

function ArticleCard({ article, onPress }: { article: ArticlePreviewVM; onPress: () => void }) {
	return (
		<CompactCard style={styles.articleCard} onPress={onPress}>
			<Image source={article.cover.url} style={styles.articleImage} cachePolicy="memory-disk" contentFit="cover" transition={150} />
			<View style={styles.articleCopy}>
				<Text style={styles.coffeeName} numberOfLines={2}>{article.title}</Text>
				<Text style={styles.muted} numberOfLines={2}>{article.intro}</Text>
			</View>
		</CompactCard>
	);
}

const styles = StyleSheet.create({
	content: { paddingHorizontal: spacing.section, gap: spacing.airy },
	section: { gap: spacing.compact },
	list: { gap: spacing.standard },
	rail: { marginHorizontal: -spacing.section },
	railContent: { gap: spacing.compact, paddingHorizontal: spacing.section },
	coffeeCard: { width: 224, paddingVertical: spacing.compact, paddingHorizontal: spacing.compact, flexDirection: "row", alignItems: "center", gap: spacing.micro },
	coffeeCopy: { flex: 1, gap: 4 },
	chevron: { ...typography.card, color: palette.textSecondary },
	coffeeName: { ...typography.card, color: palette.textPrimary },
	muted: { ...typography.body, color: palette.textSecondary },
	cardAction: { ...typography.body, color: palette.accent, fontWeight: "600", marginTop: spacing.micro },
	passPrompt: { paddingVertical: spacing.micro, gap: spacing.micro },
	passEyebrow: { ...typography.body, color: palette.textSecondary, letterSpacing: 1 },
	experienceCard: { width: 244, padding: 0, overflow: "hidden" },
	experiencePlaceholder: { height: 76, justifyContent: "center", paddingHorizontal: spacing.standard, backgroundColor: palette.elevated },
	experienceBody: { padding: spacing.compact, gap: spacing.micro },
	articleCard: { flexDirection: "row", overflow: "hidden", padding: 0, backgroundColor: "transparent" },
	articleImage: { width: 80, minHeight: 92, alignSelf: "stretch", borderRadius: radii.control, backgroundColor: palette.elevated },
	articleCopy: { flex: 1, paddingLeft: spacing.compact, paddingVertical: spacing.micro, gap: spacing.micro },
});
