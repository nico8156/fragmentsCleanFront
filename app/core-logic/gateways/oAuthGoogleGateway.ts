import {CodeProviderType, RedirectUriType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export interface oAuthGoogleGateway {
    googleCodeProvider(returnUrlRequest: RedirectUriType):Promise<CodeProviderType>
}