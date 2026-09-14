import fs from "node:fs";
import path from "node:path";

const source = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("profile navigation guardrails", () => {
	it("keeps native back access on every profile child screen", () => {
		const navigator = source("app/adapters/primary/react/navigation/RootNavigator.tsx");
		expect(navigator).toContain("headerBackVisible: true");
	});

	it("enters experiences through the profile stack instead of replacing its initial route", () => {
		const home = source("app/adapters/primary/react/features/home/screens/HomeScreen.tsx");
		expect(home).toContain('params: { screen: "Experiences", initial: false }');
	});
});
