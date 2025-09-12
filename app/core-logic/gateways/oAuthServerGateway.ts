import {RequestForTokenType, ResponseFromServerType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export interface oAuthServerGateway {
    initOAuth(url: string): Promise<any>;
    getAccessToken(request: RequestForTokenType): Promise<ResponseFromServerType>;
}

