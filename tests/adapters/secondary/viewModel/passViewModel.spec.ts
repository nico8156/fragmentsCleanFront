import { buildPassViewModel } from "@/app/adapters/secondary/viewModel/passViewModel";
import { palette } from "@/app/adapters/primary/react/css/colors";
import {
	passLevels,
	passLevelStatuses,
	type UserEntitlements,
} from "@/app/core-logic/contextWL/entitlementWl/typeAction/entitlement.type";

const baseEntitlements = (override: Partial<UserEntitlements> = {}): UserEntitlements => ({
	userId: "user_1",
	confirmedTickets: 0,
	publishedComments: 0,
	confirmedLikes: 0,
	rights: [],
	rightsSource: "backend",
	pass: {
		currentLevel: passLevels.COFFEE_TASTER,
		counters: {
			validatedTickets: 0,
			publishedComments: 0,
			confirmedLikes: 0,
		},
		levels: [
			{
				level: passLevels.COFFEE_TASTER,
				status: passLevelStatuses.IN_PROGRESS,
				requirements: { validatedTickets: 3 },
				unlockedCapabilities: ["SCAN"],
			},
			{
				level: passLevels.URBAN_EXPLORER,
				status: passLevelStatuses.LOCKED,
				requirements: { validatedTickets: 5, publishedComments: 3 },
				unlockedCapabilities: ["COMMENT"],
			},
			{
				level: passLevels.SOCIAL_BEAN,
				status: passLevelStatuses.LOCKED,
				requirements: { validatedTickets: 10, publishedComments: 5, confirmedLikes: 5 },
				unlockedCapabilities: ["LIKE"],
			},
			{
				level: passLevels.FRAGMENTS_MASTER,
				status: passLevelStatuses.LOCKED,
				requirements: {},
				unlockedCapabilities: [],
			},
		],
	},
	...override,
});

describe("buildPassViewModel", () => {
	it("maps zero progress for the initial single-objective level", () => {
		const vm = buildPassViewModel({ entitlements: baseEntitlements() });

		expect(vm.currentLevel.label).toBe("Coffee Taster");
		expect(vm.rings).toHaveLength(4);
		expect(vm.rings[0].progress).toBe(0);
		expect(vm.rings[0].status).toBe("inProgress");
		expect(vm.rings[1].status).toBe("locked");
		expect(vm.rings[0].progressColor).toBe(palette.accent);
	});

	it("computes partial progress and clamps over-completed objectives", () => {
		const entitlements = baseEntitlements({
			pass: {
				currentLevel: passLevels.URBAN_EXPLORER,
				counters: {
					validatedTickets: 99,
					publishedComments: 1,
					confirmedLikes: 0,
				},
				levels: [
					{
						level: passLevels.COFFEE_TASTER,
						status: passLevelStatuses.COMPLETED,
						requirements: { validatedTickets: 3 },
						unlockedCapabilities: ["SCAN"],
					},
					{
						level: passLevels.URBAN_EXPLORER,
						status: passLevelStatuses.IN_PROGRESS,
						requirements: { validatedTickets: 5, publishedComments: 3 },
						unlockedCapabilities: ["COMMENT"],
					},
					{
						level: passLevels.SOCIAL_BEAN,
						status: passLevelStatuses.LOCKED,
						requirements: { validatedTickets: 10, publishedComments: 5, confirmedLikes: 5 },
						unlockedCapabilities: ["LIKE"],
					},
					{
						level: passLevels.FRAGMENTS_MASTER,
						status: passLevelStatuses.LOCKED,
						requirements: {},
						unlockedCapabilities: [],
					},
				],
			},
		});

		const vm = buildPassViewModel({ entitlements });

		expect(vm.rings[0].progress).toBe(1);
		expect(vm.rings[0].status).toBe("completed");
		expect(vm.rings[1].progress).toBeCloseTo((1 + 1 / 3) / 2);
		expect(vm.currentLevel.requirements).toEqual([
			expect.objectContaining({ label: "tickets validés", current: 99, required: 5, remaining: 0, completed: true }),
			expect.objectContaining({ label: "commentaires publiés", current: 1, required: 3, remaining: 2, completed: false }),
		]);
		expect(vm.nextUnlock?.label).toBe("Commentaires");
	});

	it("keeps completed rings completed while the next level progresses", () => {
		const entitlements = baseEntitlements({
			pass: {
				currentLevel: passLevels.SOCIAL_BEAN,
				counters: {
					validatedTickets: 7,
					publishedComments: 4,
					confirmedLikes: 1,
				},
				levels: [
					{ level: passLevels.COFFEE_TASTER, status: passLevelStatuses.COMPLETED, requirements: { validatedTickets: 3 }, unlockedCapabilities: ["SCAN"] },
					{ level: passLevels.URBAN_EXPLORER, status: passLevelStatuses.COMPLETED, requirements: { validatedTickets: 5, publishedComments: 3 }, unlockedCapabilities: ["COMMENT"] },
					{ level: passLevels.SOCIAL_BEAN, status: passLevelStatuses.IN_PROGRESS, requirements: { validatedTickets: 10, publishedComments: 5, confirmedLikes: 5 }, unlockedCapabilities: ["LIKE"] },
					{ level: passLevels.FRAGMENTS_MASTER, status: passLevelStatuses.LOCKED, requirements: {}, unlockedCapabilities: [] },
				],
			},
		});

		const vm = buildPassViewModel({ entitlements });

		expect(vm.completedRings.map((ring) => ring.level)).toEqual([
			passLevels.COFFEE_TASTER,
			passLevels.URBAN_EXPLORER,
		]);
		expect(vm.rings[0].progress).toBe(1);
		expect(vm.rings[1].progress).toBe(1);
		expect(vm.rings[2].progress).toBeCloseTo((0.7 + 0.8 + 0.2) / 3);
	});

	it("represents Fragments Master as final and free without extra requirements", () => {
		const entitlements = baseEntitlements({
			pass: {
				currentLevel: passLevels.FRAGMENTS_MASTER,
				counters: {
					validatedTickets: 10,
					publishedComments: 5,
					confirmedLikes: 5,
				},
				levels: [
					{ level: passLevels.COFFEE_TASTER, status: passLevelStatuses.COMPLETED, requirements: { validatedTickets: 3 }, unlockedCapabilities: ["SCAN"] },
					{ level: passLevels.URBAN_EXPLORER, status: passLevelStatuses.COMPLETED, requirements: { validatedTickets: 5, publishedComments: 3 }, unlockedCapabilities: ["COMMENT"] },
					{ level: passLevels.SOCIAL_BEAN, status: passLevelStatuses.COMPLETED, requirements: { validatedTickets: 10, publishedComments: 5, confirmedLikes: 5 }, unlockedCapabilities: ["LIKE"] },
					{ level: passLevels.FRAGMENTS_MASTER, status: passLevelStatuses.COMPLETED, requirements: {}, unlockedCapabilities: [] },
				],
			},
		});

		const vm = buildPassViewModel({ entitlements });

		expect(vm.currentLevel.label).toBe("Fragments Master");
		expect(vm.currentLevel.requirements).toEqual([]);
		expect(vm.nextUnlock).toBeUndefined();
		expect(vm.rings[3].progress).toBe(1);
	});
});
