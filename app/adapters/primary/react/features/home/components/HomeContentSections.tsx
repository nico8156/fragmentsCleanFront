import { palette } from "@/app/adapters/primary/react/css/colors";
import type { ArticlePreviewVM } from "@/app/adapters/secondary/viewModel/useArticlesHome";
import type { HomeContentVM } from "@/app/adapters/secondary/viewModel/homeContentViewModel";
import type { DiscoveryCoffeeVM } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export function HomeContentSections({ content, onOpenMap, onOpenScan, onOpenCoffee, onOpenArticle, onOpenExperiences, onOpenPass }: {
	content: HomeContentVM;
	onOpenMap: () => void;
	onOpenScan: () => void;
	onOpenCoffee: (id: string) => void;
	onOpenArticle: (slug: string) => void;
	onOpenExperiences: () => void;
	onOpenPass: () => void;
}) {
	return <View style={styles.content}>
		<Section title={content.coffeeTitle} action="Voir la carte" onAction={onOpenMap}>
			{content.coffees.length ? <View style={styles.list}>{content.coffees.map((coffee) => <CoffeeCard key={String(coffee.id)} coffee={coffee} onPress={() => onOpenCoffee(String(coffee.id))} />)}</View> : <Empty text="La sélection arrive ici dès que le catalogue est disponible." action="Ouvrir la carte" onAction={onOpenMap} />}
		</Section>
		<Section title="Prochaine étape" action="Voir mon Pass" onAction={onOpenPass}>
			<Pressable style={styles.passCard} onPress={content.pass.action === "scan" ? onOpenScan : onOpenMap} accessibilityRole="button">
				<Text style={styles.passEyebrow}>PASS FRAGMENTS</Text><Text style={styles.passTitle}>{content.pass.title}</Text><Text style={styles.passDetail}>{content.pass.detail}</Text><Text style={styles.passAction}>{content.pass.actionLabel} ›</Text>
			</Pressable>
		</Section>
		<Section title="Tes expériences" action="Tout voir" onAction={onOpenExperiences}>
			{content.experiences.length ? <View style={styles.list}>{content.experiences.map((experience) => <View key={experience.id} style={styles.experienceCard}>{experience.imageUrl ? <Image source={{ uri: experience.imageUrl }} style={styles.experienceImage} /> : null}<View style={styles.experienceBody}><Text style={styles.coffeeName}>{experience.coffeeName}</Text><Text numberOfLines={3} style={styles.experienceText}>{experience.message}</Text></View></View>)}</View> : <Empty text="Raconte une visite depuis la fiche d’un café, avec ou sans ticket." action="Trouver un café" onAction={onOpenMap} />}
		</Section>
		{content.articles.length ? <Section title="À lire ensuite"><View style={styles.list}>{content.articles.map((article) => <ArticleCard key={article.id} article={article} onPress={() => onOpenArticle(article.slug)} />)}</View></Section> : null}
	</View>;
}

function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action && onAction ? <Pressable onPress={onAction} accessibilityRole="button"><Text style={styles.link}>{action}</Text></Pressable> : null}</View>{children}</View>; }
function CoffeeCard({ coffee, onPress }: { coffee: DiscoveryCoffeeVM; onPress: () => void }) { return <Pressable style={styles.coffeeCard} onPress={onPress} accessibilityRole="button"><View style={styles.coffeeCopy}><Text style={styles.coffeeName}>{coffee.name}</Text><Text style={styles.muted} numberOfLines={1}>{[coffee.city, coffee.distanceText, coffee.isOpenNow === undefined ? undefined : coffee.isOpenNow ? "Ouvert" : "Fermé"].filter(Boolean).join(" · ") || "Voir la fiche"}</Text></View><Text style={styles.chevron}>›</Text></Pressable>; }
function ArticleCard({ article, onPress }: { article: ArticlePreviewVM; onPress: () => void }) { return <Pressable style={styles.articleCard} onPress={onPress} accessibilityRole="button"><Image source={article.cover} style={styles.articleImage} /><View style={styles.articleCopy}><Text style={styles.coffeeName} numberOfLines={2}>{article.title}</Text><Text style={styles.muted} numberOfLines={2}>{article.intro}</Text></View></Pressable>; }
function Empty({ text, action, onAction }: { text: string; action: string; onAction: () => void }) { return <View style={styles.empty}><Text style={styles.muted}>{text}</Text><Pressable onPress={onAction} accessibilityRole="button"><Text style={styles.link}>{action}</Text></Pressable></View>; }

const styles = StyleSheet.create({ content: { paddingHorizontal: 24, gap: 32 }, section: { gap: 14 }, sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }, sectionTitle: { color: palette.textPrimary, fontSize: 21, fontWeight: "800" }, link: { color: palette.accent, fontSize: 14, fontWeight: "800" }, list: { gap: 10 }, coffeeCard: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 }, coffeeCopy: { flex: 1, gap: 4 }, coffeeName: { color: palette.textPrimary, fontSize: 16, fontWeight: "800" }, muted: { color: palette.textSecondary, fontSize: 14, lineHeight: 19 }, chevron: { color: palette.accent, fontSize: 26, paddingLeft: 12 }, passCard: { backgroundColor: palette.overlay, borderColor: palette.accentMuted, borderWidth: 1, borderRadius: 16, padding: 18, gap: 7 }, passEyebrow: { color: palette.accent, fontSize: 12, fontWeight: "900", letterSpacing: 1 }, passTitle: { color: palette.textPrimary, fontSize: 18, fontWeight: "800", lineHeight: 24 }, passDetail: { color: palette.textSecondary, fontSize: 14 }, passAction: { color: palette.accent, fontWeight: "800", marginTop: 4 }, experienceCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, overflow: "hidden" }, experienceImage: { width: "100%", aspectRatio: 16 / 8, backgroundColor: palette.elevated }, experienceBody: { padding: 14, gap: 6 }, experienceText: { color: palette.textSecondary, lineHeight: 20 }, articleCard: { flexDirection: "row", overflow: "hidden", minHeight: 92, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14 }, articleImage: { width: 92, height: 92, backgroundColor: palette.elevated }, articleCopy: { flex: 1, padding: 12, gap: 5 }, empty: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border, padding: 16, gap: 10 } });
