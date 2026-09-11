export function filterPublicCoffeeTags(tags: string[] | undefined): string[] {
	return (tags ?? []).filter((tag) => {
		const normalized = tag.trim().toLocaleLowerCase("fr-FR");
		return normalized !== "google-places" && normalized !== "google_places" && !normalized.startsWith("google:") && !normalized.startsWith("source:");
	});
}
