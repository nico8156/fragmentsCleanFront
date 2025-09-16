import {OAuthServerGateway} from '@/app/core-logic/gateways/oAuthServerGateway';
import {
    RequestForTokenType,
    ResponseFromInitServerType,
    ResponseFromServerType
} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";
import {OAuthServerApiHandler} from "@/app/adapters/secondary/gateways/auth/server/oAuthServerApiHandler";

export class AuthServerGateway implements OAuthServerGateway {

    constructor(private readonly oAuthServerApiHandler: OAuthServerApiHandler ) {}

    async initOAuth(url: string): Promise<ResponseFromInitServerType> {
        const apiResponse = await this.oAuthServerApiHandler.getOAuthUrlAndState(url);
        return apiResponse;
    }
    getAccessToken(request: RequestForTokenType): Promise<ResponseFromServerType> {
        throw new Error("Method not implemented.");
    }

}