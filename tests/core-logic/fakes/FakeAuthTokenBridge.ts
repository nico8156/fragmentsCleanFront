export class FakeAuthTokenBridge {
    constructor(private token: string | null, private userId: string | null) {}
    async getAccessToken() { return this.token; }
    getCurrentUserId() { return this.userId; }
}
