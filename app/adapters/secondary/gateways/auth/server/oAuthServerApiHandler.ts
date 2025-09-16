import {ResponseFromInitServerType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export interface OAuthServerApiHandler {
    getOAuthUrlAndState(url: string): Promise<ResponseFromInitServerType>;
}