import {CodeProviderType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export interface OAuthGoogleApiHandler {
    getCodeAndStateFromGoogle(): Promise<CodeProviderType>
}