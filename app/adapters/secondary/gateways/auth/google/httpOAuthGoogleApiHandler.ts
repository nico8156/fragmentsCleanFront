import {OAuthGoogleApiHandler} from "@/app/adapters/secondary/gateways/auth/google/oAuthGoogleApiHandler";
import {CodeProviderType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export class HttpOAuthGoogleApiHandler implements OAuthGoogleApiHandler{
    async getCodeAndStateFromGoogle (): Promise<CodeProviderType> {
        return Promise.resolve({
            type: "success",
            params: {
                code: "fake-code",
                state: "stateId-for-fake-server",
            },
        })
    }
}