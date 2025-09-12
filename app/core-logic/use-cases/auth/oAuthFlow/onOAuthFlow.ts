import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import {User} from "@/app/store/appState";

export const loginWithGoogleBeginned = createAction("LOGIN_WITH_GOOGLE_BEGIN");
export const loginWithGoogleSucceeded = createAction<User>("LOGIN_WITH_GOOGLE_SUCCEEDED");

export type RedirectUriType = {authUrl: string};
export type ResponseFromInitServerType = { authorizationUrl: string, stateId: string };
export type CodeProviderType = { type: string, params: { code: string, state: string, } };
export type RequestForTokenType = { code: string, stateId: string };
export type ResponseFromServerType = { accessToken: string, refreshToken: string,expiresIn: number,tokenType: string, user: { id: string, email: string, name: string, picture: string }   };


export const loginWithGoogleRequested =
    () :AppThunk<Promise<void>> =>
    async (dispatch, getState, {oAuthServerGateway, oAuthGoogleGateway, secureStorageGateway}) => {

        dispatch(loginWithGoogleBeginned());

        try{
                const startResp = await oAuthServerGateway.initOAuth("/auth/mobile/google/start");
                const { authorizationUrl, stateId } = startResp
                //    sync              async
                // makeRedirectUri et startAsync s'executent consecutivement ==> on fake en regroupant et recuperant un objet
                const respFromGoogle = await oAuthGoogleGateway.googleCodeProvider({authUrl: authorizationUrl});
                const {code} = respFromGoogle.params;
                // nous avons maintenant la fin de l'etape google coté front .
                // la derniere etape peut commencer a savoir l'echange avec notre server
                const authFromServer = await oAuthServerGateway.getAccessToken({code, stateId});
                const {user} = authFromServer;

                //happy flow => on a bien les tokens et le USER,
                // 1 on peut uptdate le state de l'appli pour le user
                dispatch(loginWithGoogleSucceeded(user))
                // 2 les tokens sont stockes dans le secure store
                const {accessToken, refreshToken, expiresIn} = authFromServer;
                await secureStorageGateway.setItemAsync("accessToken", accessToken);
                await secureStorageGateway.setItemAsync("refreshToken", refreshToken);
                await secureStorageGateway.setItemAsync("accessTokenExpiresAt", String(Date.now() + expiresIn * 1000));
                // TODO 3 on peut paremetrer le client http pour les requetes server avec le bearer


        } catch (e) {
                const err = e instanceof Error ? e : new Error(typeof e === "string" ? e : JSON.stringify(e));

                throw err; // re-jette une *vraie* Error, jamais un objet nu
        }
    }
