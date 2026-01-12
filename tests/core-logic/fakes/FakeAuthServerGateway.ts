export class FakeAuthServerGateway {
	constructor(private readonly ttlMs: number = 2 * 60 * 60 * 1000) { }

	refreshedUser?: any;

	async refreshSession(session: any) {
		const user = this.refreshedUser; // optionnel: peut rester undefined
		return {
			session: {
				...session,
				tokens: {
					...session.tokens,
					// conserve accessToken / refreshToken si présents
					expiresAt: Date.now() + this.ttlMs,
				},
			},
			user, // peut être undefined
		};
	}
	async signInWithProvider(_input: any) {
		const user = this.refreshedUser ?? { id: "user_test", displayName: "Fake User" };
		return {
			session: {
				userId: user.id,
				provider: "google",
				scopes: ["openid"],
				establishedAt: Date.now(),
				tokens: {
					accessToken: "app-access-token",
					refreshToken: "refresh-token",
					expiresAt: Date.now() + this.ttlMs,
					tokenType: "Bearer",
				},
			},
			user,
		};
	}
}

