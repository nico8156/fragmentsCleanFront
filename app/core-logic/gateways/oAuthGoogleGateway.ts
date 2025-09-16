import {CodeProviderType, RedirectUriType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export interface OAuthGoogleGateway {
    googleCodeProvider(returnUrlRequest: RedirectUriType):Promise<CodeProviderType>
}