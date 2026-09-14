import { HttpUserRepo } from "@/app/adapters/secondary/gateways/user/HttpUserRepo";

const mockUploadPrivateFile = jest.fn();
jest.mock("@/app/adapters/secondary/gateways/media/uploadPrivateFile", () => ({
	uploadPrivateFile: (...args: unknown[]) => mockUploadPrivateFile(...args),
}));

describe("HttpUserRepo", () => {
	const originalFetch = global.fetch;

	afterEach(() => {
		global.fetch = originalFetch;
		mockUploadPrivateFile.mockReset();
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

	it("uploads an avatar to private storage then confirms the command", async () => {
		global.fetch = jest.fn()
			.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ uploadRequired: true, uploadUrl: "https://s3.test/avatar", method: "PUT", headers: { "Content-Type": "image/png" } }) })
			.mockResolvedValueOnce({ ok: true, status: 202 }) as any;
		mockUploadPrivateFile.mockResolvedValueOnce({ ok: true, status: 200 });
		const gateway = new HttpUserRepo({ baseUrl: "https://api.fragments.test", getAccessToken: async () => "jwt" });

		await gateway.uploadAvatar({ commandId: "cmd", mediaId: "media", image: { localUri: "file:///private/avatar.png", contentType: "image/png", size: 128 }, at: "2026-09-11T10:00:00Z" });

		expect((global.fetch as jest.Mock).mock.calls.map(call => call[0])).toEqual([
			"https://api.fragments.test/api/users/me/avatar/upload-intents",
			"https://api.fragments.test/api/users/me/avatar/media/confirm",
		]);
		expect(mockUploadPrivateFile).toHaveBeenCalledWith({
			url: "https://s3.test/avatar",
			method: "PUT",
			headers: { "Content-Type": "image/png" },
			localUri: "file:///private/avatar.png",
		});
	});
});
