const mockIsAvailableAsync = jest.fn();
const mockSignInAsync = jest.fn();

jest.mock("expo-apple-authentication", () => ({
	isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
	signInAsync: (...args: unknown[]) => mockSignInAsync(...args),
	AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

import { appleOAuthGateway } from "@/app/adapters/secondary/gateways/auth/appleOAuthGateway";

describe("appleOAuthGateway", () => {
	beforeEach(() => {
		mockIsAvailableAsync.mockReset();
		mockSignInAsync.mockReset();
	});

	it("maps the native Apple credential to the provider-neutral authorization contract", async () => {
		mockIsAvailableAsync.mockResolvedValue(true);
		mockSignInAsync.mockResolvedValue({
			user: "apple-user",
			email: "relay@privaterelay.appleid.com",
			fullName: { givenName: "Nicolas", familyName: "Maldiney" },
			authorizationCode: "authorization-code",
			identityToken: "identity-token",
		});

		await expect(appleOAuthGateway.startSignIn("apple")).resolves.toMatchObject({
			profile: {
				provider: "apple",
				providerUserId: "apple-user",
				displayName: "Nicolas Maldiney",
			},
			authorization: {
				authorizationCode: "authorization-code",
				idToken: "identity-token",
			},
		});
	});

	it("refuses to start when native Apple authentication is unavailable", async () => {
		mockIsAvailableAsync.mockResolvedValue(false);

		await expect(appleOAuthGateway.startSignIn("apple")).rejects.toThrow(
			"Sign in with Apple is unavailable",
		);
		expect(mockSignInAsync).not.toHaveBeenCalled();
	});
});
