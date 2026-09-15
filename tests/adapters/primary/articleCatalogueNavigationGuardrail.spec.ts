import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("published article catalogue route", () => {
	it("links Home to a complete catalogue and article detail without duplicating editorial data", () => {
		const base = process.cwd();
		const home = readFileSync(join(base, "app/adapters/primary/react/features/home/screens/HomeScreen.tsx"), "utf8");
		const sections = readFileSync(join(base, "app/adapters/primary/react/features/home/components/HomeContentSections.tsx"), "utf8");
		const root = readFileSync(join(base, "app/adapters/primary/react/navigation/RootNavigator.tsx"), "utf8");
		expect(home).toContain('navigation.navigate("ArticleCatalogue")');
		expect(sections).toContain('action="Tous les articles"');
		expect(root).toContain('name="ArticleCatalogue"');
	});
});
