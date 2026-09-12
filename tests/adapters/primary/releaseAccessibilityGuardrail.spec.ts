import fs from "node:fs";
import path from "node:path";

const source = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("release accessibility guardrails", () => {
	it("keeps icon-only discovery controls named and avoids duplicate Home focus targets", () => {
		const home = source("app/adapters/primary/react/features/home/screens/HomeScreen.tsx");
		const mapActions = source("app/adapters/primary/react/features/map/components/ActionButtonsWrapper.tsx");
		const location = source("app/adapters/primary/react/features/map/components/coffeeSelection/localisationButton.tsx");

		expect(home.match(/accessibilityElementsHidden=/g)).toHaveLength(4);
		expect(home).toContain('accessibilityLabel="Rechercher"');
		expect(home).toContain('accessibilityLabel="Scanner un ticket"');
		expect(mapActions).toContain('accessibilityLabel="Afficher la liste des cafés"');
		expect(location).toContain('accessibilityLabel={isFollowing ? "Recentrer sur ma position, suivi actif"');
	});

	it("keeps ticket, profile and experience mutations exposed as accessible controls", () => {
		const scan = source("app/adapters/primary/react/features/scan/screens/ScanTicketScreen.tsx");
		const profile = source("app/adapters/primary/react/features/profile/screens/EditProfileScreen.tsx");
		const experiences = source("app/adapters/primary/react/features/cafes/components/ExperiencesSection.tsx");

		expect(scan).toContain('accessibilityLabel="Envoyer le ticket"');
		expect(scan).toContain('accessibilityRole="alert"');
		expect(profile).toContain('accessibilityLabel="Nom affiché"');
		expect(profile).toContain('accessibilityState={{ disabled: pending || unchanged, busy: pending }}');
		expect(experiences).toContain('accessibilityLabel="Modifier mon expérience"');
		expect(experiences).toContain('accessibilityLiveRegion="polite"');
	});
});
