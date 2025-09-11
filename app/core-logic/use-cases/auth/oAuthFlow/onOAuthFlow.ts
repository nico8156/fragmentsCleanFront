import {AppThunk} from "@/app/store/reduxStore";
import {createAction} from "@reduxjs/toolkit";

export const loginWithGoogleBeginned = createAction("LOGIN_WITH_GOOGLE_BEGIN");

export type RedirectUriType = {scheme: string; useProxy?: boolean}
export type AuthSessionResultType = {}

export const loginWithGoogleRequested =
    () :AppThunk<Promise<void>> =>
    async (dispatch, getState, {oAuthGateway}) => {
        dispatch(loginWithGoogleBeginned());
        const startResp = await oAuthGateway.initOAuth("/auth/mobile/google/start");
        const { authorizationUrl, stateId } = startResp.data as {
            authorizationUrl: string;
            stateId: string;
        };
        //AuthSession.startAsync affiche la page Google.

        const returnUrl = AuthSession.makeRedirectUri({
            scheme: "myapp",
            // useProxy: true  // utile en dev Expo si besoin
        } as RedirectUriType);
        const result = await AuthSession.startAsync({
            authUrl: authorizationUrl,
            returnUrl,
        });


    }
