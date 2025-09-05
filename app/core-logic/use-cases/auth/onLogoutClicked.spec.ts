import {AuthGateway} from "@/app/core-logic/gateways/authGateway";
import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeAuthGateway} from "@/app/adapters/secondary/gateways/fake/fakeAuthGateway";
import {onLogoutClicked} from "@/app/core-logic/use-cases/auth/onLogoutClicked";

describe('on Logout Button Clicked,  ', () => {
    let store: ReduxStore;
    let authGateway: AuthGateway;

    beforeEach(() => {
        authGateway = new FakeAuthGateway();
        store = initReduxStore({gateways: {authGateway}});
    })
    it('should logout the user from the app', async () => {
        await store.dispatch(onLogoutClicked());
        expect(store.getState().authState.authData.user).toEqual(null);
    })
})