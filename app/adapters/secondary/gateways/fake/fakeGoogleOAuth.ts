import {oAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import { RedirectUriType, CodeProviderType } from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export class FakeGoogleOAuth implements oAuthGoogleGateway {
    async googleCodeProvider(returnUrlRequest: RedirectUriType): Promise<CodeProviderType> {
        await new Promise((r) => setTimeout(r, 0));
        return {
            type: "success",
            params: {
                code: "fake-code",
                state: "stateId-for-fake-server",
            },
        };
    }
}