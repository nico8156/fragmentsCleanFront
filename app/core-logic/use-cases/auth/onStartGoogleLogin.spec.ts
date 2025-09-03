import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {FakeAuthGateway} from "@/app/adapters/secondary/gateways/fakeAuthGateway";
import {startGoogleLogin} from "@/app/core-logic/use-cases/auth/onStartGoogleLogin";

describe('on Start Google Login, ', () => {
    let store: ReduxStore;
    let authGateway: FakeAuthGateway;

    beforeEach(() => {
        authGateway = new FakeAuthGateway();
        store = initReduxStore({gateways: {authGateway}});
    })

    it('should modify auth status to authenticating ...', async () => {
        await store.dispatch(startGoogleLogin());
        expect(store.getState().authState.authData.status).toEqual("authenticating");
    })
})