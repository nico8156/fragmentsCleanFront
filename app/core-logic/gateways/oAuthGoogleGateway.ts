import {RedirectUriType} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";


export interface oAuthGoogleGateway {
    startAsync(returnUrlRequest: RedirectUriType):Promise<>
    makeRedirectUri():Promise<any>
}