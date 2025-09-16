import {OAuthServerApiHandler} from "@/app/adapters/secondary/gateways/auth/server/oAuthServerApiHandler";
import { ResponseFromInitServerType } from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export class HttpOAuthServerApiHandler implements OAuthServerApiHandler {
    async getOAuthUrlAndState(url:string): Promise<ResponseFromInitServerType> {
        return {
            authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?...",
                stateId: "stateId-for-fake-server",
        };
    }

}