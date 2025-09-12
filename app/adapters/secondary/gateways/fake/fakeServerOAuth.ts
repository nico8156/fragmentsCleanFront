import {oAuthServerGateway} from "@/app/core-logic/gateways/oAuthServerGateway";
import {
    RequestForTokenType,
    ResponseFromInitServerType,
    ResponseFromServerType
} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export class FakeServerOAuth implements oAuthServerGateway{
    async initOAuth(_url: string): Promise<ResponseFromInitServerType> {
        await new Promise((r) => setTimeout(r, 0));
        return {
            authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?...",
            stateId: "stateId-for-fake-server",
        };
    }

    async getAccessToken(request: RequestForTokenType): Promise<ResponseFromServerType> {
        await new Promise((r) => setTimeout(r, 0));
        return {
            accessToken: "fake-access-token",
            refreshToken: "fake-refresh-token",
            expiresIn: 3600,
            tokenType: "Bearer",
            user: {
                id: "fake-user-id",
                name: "fake-user-name",
                email: "fake-user-email",
                picture: "fake-user-picture",
            },
        };
    }
}