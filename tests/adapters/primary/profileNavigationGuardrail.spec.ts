import fs from "node:fs";
import path from "node:path";

const source = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("profile navigation guardrails", () => {
	it("keeps compact back access on every profile child screen", () => {
		const navigator = source("app/adapters/primary/react/navigation/RootNavigator.tsx");
		expect(navigator).toContain("<ProfileHeader");
		expect(navigator).toContain("onBack={back ? () => navigation.goBack() : undefined}");
	});

	it("uses a single large root profile title while keeping child headers enabled", () => {
        const navigator = source("app/adapters/primary/react/navigation/RootNavigator.tsx");
        expect(navigator).toContain('name="ProfileHome" component={ProfileScreen} options={{ title: "Profil", headerShown: false }}');
        expect(navigator).toContain("headerShown: true");
        const profile = source("app/adapters/primary/react/features/profile/screens/ProfileScreen.tsx");
        expect(profile).toContain('edges={["top", "left", "right"]}');
        expect(profile).toContain("<RootScreenTitle>Profil</RootScreenTitle>");
        const pass = source("app/adapters/primary/react/features/pass/components/PassContent.tsx");
        expect(pass).toContain("<RootScreenTitle>{vm.title}</RootScreenTitle>");
        expect(profile).toContain("<ProfileHero");
        expect(profile).toContain('handleNavigate("EditProfile")');
    });

	it.each([
		"experiences/screens/MyExperiencesScreen.tsx",
		"profile/screens/FavoritesScreen.tsx",
		"profile/screens/TicketsScreen.tsx",
		"profile/screens/AppSettingsScreen.tsx",
		"profile/screens/EditProfileScreen.tsx",
	])("keeps %s inside the shared profile scroll clearance", screen => {
		const component = source(`app/adapters/primary/react/features/${screen}`);
		expect(component).toContain("<ProfileLayout");
		expect(component).toContain("</ProfileLayout>");
	});

	it("enters experiences through the profile stack instead of replacing its initial route", () => {
		const home = source("app/adapters/primary/react/features/home/screens/HomeScreen.tsx");
		expect(home).toContain('params: { screen: "Experiences", initial: false }');
	});
});
