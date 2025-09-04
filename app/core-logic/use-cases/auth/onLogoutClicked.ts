import {createAction} from "@reduxjs/toolkit";
import {AppThunk} from "@/app/store/reduxStore";

export const logoutClicked = createAction("LOGOUT_CLICKED");

export const onLogoutClicked =
    ():AppThunk<Promise<void>> =>
        async (dispatch, getState, {authGateway}) => {
            await authGateway.logout();
            dispatch(logoutClicked());
}