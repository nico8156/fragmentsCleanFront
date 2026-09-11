import { HttpUserRepo } from "@/app/adapters/secondary/gateways/user/HttpUserRepo";

describe("HttpUserRepo", () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it("reads the product profile from userApplicationContext", async () => {
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				userId: "11111111-1111-4111-8111-111111111111",
				displayName: "Nicolas",
				avatarUrl: null,
				createdAt: "2026-09-11T10:00:00Z",
				updatedAt: "2026-09-11T11:00:00Z",
				version: 3,
			}),
		}) as any;
		const gateway = new HttpUserRepo({ baseUrl: "https://api.fragments.test/", getAccessToken: async () => "jwt" });

		const profile = await gateway.getById("ignored" as any);

		expect(global.fetch).toHaveBeenCalledWith("https://api.fragments.test/api/users/me", expect.any(Object));
		expect(profile).toMatchObject({ displayName: "Nicolas", version: 3 });
	});

	it("sends the durable profile update contract", async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202 }) as any;
		const gateway = new HttpUserRepo({ baseUrl: "https://api.fragments.test", getAccessToken: async () => "jwt" });

		await gateway.updateProfile({
			commandId: "22222222-2222-4222-8222-222222222222",
			displayName: "Nicolas Maldiney",
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"https://api.fragments.test/api/users/me/profile",
			expect.objectContaining({
				method: "PATCH",
				body: JSON.stringify({
					commandId: "22222222-2222-4222-8222-222222222222",
					displayName: "Nicolas Maldiney",
				}),
			}),
		);
	});
});
