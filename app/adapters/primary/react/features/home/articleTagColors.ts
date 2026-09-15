const tones = ["#4FB28E", "#C5B7E8", "#E7BB65", "#EFA88F", "#94BBDC"] as const;
const categories: Record<string, number> = {
	origines: 0, terroir: 0, qualite: 0,
	"bien-etre": 1, nutrition: 1, science: 1,
	culture: 2, durabilite: 2, producteurs: 2,
	maison: 3, recettes: 3, equipement: 3,
	decouverte: 4, torrefacteurs: 4, communaute: 4,
};

export function articleTagColors(tag: string) {
	const key = tag.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	const index = categories[key] ?? [...key].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0) % tones.length;
	return { backgroundColor: tones[index], color: "#1A0D08" };
}
