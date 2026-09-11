import { buildPassViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { passLevels, passLevelStatuses, type UserEntitlements } from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";

const levels = [
	{ level: passLevels.COFFEE_TASTER, status: passLevelStatuses.IN_PROGRESS,
		requirements: { publishedExperiences: 1, distinctExperiencedCoffees: 1, validatedTickets: 0 }, unlockedCapabilities: [] },
	{ level: passLevels.URBAN_EXPLORER, status: passLevelStatuses.LOCKED,
		requirements: { publishedExperiences: 3, distinctExperiencedCoffees: 3, validatedTickets: 0 }, unlockedCapabilities: [] },
	{ level: passLevels.SOCIAL_BEAN, status: passLevelStatuses.LOCKED,
		requirements: { publishedExperiences: 5, distinctExperiencedCoffees: 3, validatedTickets: 1 }, unlockedCapabilities: [] },
	{ level: passLevels.FRAGMENTS_MASTER, status: passLevelStatuses.LOCKED,
		requirements: { publishedExperiences: 10, distinctExperiencedCoffees: 5, validatedTickets: 3 }, unlockedCapabilities: [] },
];

const entitlements = (override: Partial<NonNullable<UserEntitlements["pass"]>> = {}): UserEntitlements => ({
	userId: "user_1", confirmedTickets: 0, rights: [], rightsSource: "backend",
	pass: {
		currentLevel: passLevels.COFFEE_TASTER,
		counters: { publishedExperiences: 0, distinctExperiencedCoffees: 0, validatedTickets: 0 },
		levels,
		policyVersion: 2,
		...override,
	},
});

describe("buildPassViewModel v2", () => {
	it("maps the backend-owned experience-first policy", () => {
		const vm = buildPassViewModel({ entitlements: entitlements() });
		expect(vm.currentLevel.label).toBe("Coffee Taster");
		expect(vm.currentLevel.requirements.map((item) => item.label)).toEqual([
			"expériences publiées", "cafés découverts",
		]);
		expect(vm.currentLevel.requirements.some((item) => item.label === "tickets validés")).toBe(false);
		expect(vm.rings[0].progressColor).toBe(palette.accent);
	});

	it("requires a validated ticket only from Social Bean", () => {
		const socialLevels = levels.map((level) => ({ ...level,
			status: level.level === passLevels.COFFEE_TASTER || level.level === passLevels.URBAN_EXPLORER
				? passLevelStatuses.COMPLETED
				: level.level === passLevels.SOCIAL_BEAN ? passLevelStatuses.IN_PROGRESS : passLevelStatuses.LOCKED,
		}));
		const vm = buildPassViewModel({ entitlements: entitlements({
			currentLevel: passLevels.SOCIAL_BEAN,
			counters: { publishedExperiences: 5, distinctExperiencedCoffees: 3, validatedTickets: 0 },
			levels: socialLevels,
		}) });
		expect(vm.currentLevel.requirements).toEqual(expect.arrayContaining([
			expect.objectContaining({ label: "tickets validés", required: 1, remaining: 1 }),
		]));
		expect(vm.counters).toEqual({ experiences: 5, cafes: 3, tickets: 0 });
	});

	it("keeps an acquired level completed after an ordinary counter reduction", () => {
		const preserved = levels.map((level) => level.level === passLevels.COFFEE_TASTER
			? { ...level, status: passLevelStatuses.COMPLETED }
			: level.level === passLevels.URBAN_EXPLORER
				? { ...level, status: passLevelStatuses.IN_PROGRESS }
				: level);
		const vm = buildPassViewModel({ entitlements: entitlements({
			currentLevel: passLevels.URBAN_EXPLORER, levels: preserved,
		}) });
		expect(vm.rings[0].status).toBe("completed");
		expect(vm.currentLevel.level).toBe(passLevels.URBAN_EXPLORER);
	});

	it("represents Fragments Master with explicit final requirements", () => {
		const masterLevels = levels.map((level) => ({ ...level, status: passLevelStatuses.COMPLETED }));
		const vm = buildPassViewModel({ entitlements: entitlements({
			currentLevel: passLevels.FRAGMENTS_MASTER,
			counters: { publishedExperiences: 10, distinctExperiencedCoffees: 5, validatedTickets: 3 },
			levels: masterLevels,
		}) });
		expect(vm.currentLevel.requirements).toHaveLength(3);
		expect(vm.currentLevel.progressPercent).toBe(100);
		expect(vm.rings[3].status).toBe("completed");
	});
});
