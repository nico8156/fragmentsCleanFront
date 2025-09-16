import {OAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import { RedirectUriType, CodeProviderType } from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";
import {OAuthGoogleApiHandler} from "@/app/adapters/secondary/gateways/auth/google/oAuthGoogleApiHandler";

export class GoogleGateway implements OAuthGoogleGateway {

    constructor(private readonly httpClient: OAuthGoogleApiHandler) {}

    async googleCodeProvider(returnUrlRequest: RedirectUriType): Promise<CodeProviderType> {
        const apiResponse = await this.httpClient.getCodeAndStateFromGoogle();
        return apiResponse;
    }

}