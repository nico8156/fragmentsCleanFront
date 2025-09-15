import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";
import {STORAGE_KEYS, User} from "@/app/store/appState";

export const loginWithGoogleBegan = createAction("LOGIN_WITH_GOOGLE_BEGIN");
export const loginWithGoogleSucceeded = createAction<User>("LOGIN_WITH_GOOGLE_SUCCEEDED");
export const loginWithGoogleFailed = createAction<{ step: string, message: string }>("LOGIN_WITH_GOOGLE_FAILED");

export type RedirectUriType = {authUrl: string};
export type ResponseFromInitServerType = { authorizationUrl: string, stateId: string };
export type CodeProviderType = { type: string, params: { code?: string, state: string, } };
export type RequestForTokenType = { code: string, stateId: string };
export type ResponseFromServerType = { accessToken: string, refreshToken: string,expiresIn: number,tokenType: string, user: User  };

// petit dela pour eviter une echeance trop proche de la fenetre impartie => refresh un peu en avance!
const SKEW_MS = 60_000;
const toMessage = (e: unknown) => e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);

export const loginWithGoogleRequested =
    () :AppThunk<Promise<void>> =>

    async (dispatch, getState, {oAuthServerGateway, oAuthGoogleGateway, secureStorageGateway}) => {
            //    sync              async
            // makeRedirectUri et startAsync s'éxecutent consecutivement ==> on fake en regroupant et recuperant un objet
        let authorizationUrl:string;
        let stateId: string;

        dispatch(loginWithGoogleBegan());
        try{
                const startResp = await oAuthServerGateway.initOAuth("/auth/mobile/google/start");
                authorizationUrl = startResp.authorizationUrl;
                stateId = startResp.stateId;

        }catch(e: Error | unknown){
                const errorMessage = e instanceof Error ? e.message : toMessage(e);
                dispatch(loginWithGoogleFailed({step: "initOAuth", message: errorMessage}))
                return;
                //throw e instanceof Error ? e : new Error(toMessage(e));
        }


        // nous avons maintenant l'etape google coté front , extraction des donnees puis vérifications:
        let code :string;
        try{
                const respFromGoogle = await oAuthGoogleGateway.googleCodeProvider({authUrl: authorizationUrl});
                //absence du code dans la réponse
                if (!respFromGoogle?.params?.code) {
                        throw new Error("No authorization code returned by Google");
                }
                // le type de réponse n'est pas "success"
                if (respFromGoogle.type !== "success") {
                        const reason = respFromGoogle.type === "dismiss" ? "user cancelled" : "provider error";
                        throw new Error(reason);
                }
                // le state n'est pas le meme que le stateId (provenant du server)
                if (respFromGoogle.params.state !== stateId) {
                        throw new Error("OAuth state mismatch");
                }
                code = respFromGoogle.params.code;
        }catch(e: Error | unknown){
                const errorMessage = e instanceof Error ? e.message : toMessage(e);
                dispatch(loginWithGoogleFailed({step: "google", message: errorMessage}))
                return;
        }


        // la derniere etape peut commencer a savoir l'echange avec notre server
        // 3) échanger le code contre des tokens auprès de ton serveur
        let authFromServer:ResponseFromServerType;
        try{
                authFromServer = await oAuthServerGateway.getAccessToken({code, stateId});
        }catch(e: Error | unknown){
                const errorMessage = e instanceof Error ? e.message : toMessage(e);
                dispatch(loginWithGoogleFailed({step: "getAccessToken", message: errorMessage}))
                return;
        }


        // 4) happy path : maj du state + stockage sécurisé
                const {user,accessToken, refreshToken, expiresIn} = authFromServer;
        try{
                await secureStorageGateway.setItemAsync(STORAGE_KEYS.accessToken, accessToken);
                await secureStorageGateway.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken);
                await secureStorageGateway.setItemAsync(STORAGE_KEYS.accessTokenExpiresAt, Date.now() + expiresIn * 1000 - SKEW_MS);
        }catch(e: Error | unknown){
                try{
                        dispatch(loginWithGoogleFailed({ step: "storage", message: toMessage(e) }));
                        await secureStorageGateway.removeItemAsync?.(STORAGE_KEYS.accessToken);
                        await secureStorageGateway.removeItemAsync?.(STORAGE_KEYS.refreshToken);
                        await secureStorageGateway.removeItemAsync?.(STORAGE_KEYS.accessTokenExpiresAt);
                        return
                } catch(e){

                }
        }
        dispatch(loginWithGoogleSucceeded(user))
    }

// TODO 3 on peut paremetrer le client http pour les requetes server avec le bearer
