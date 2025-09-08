// test
import { initReduxStore, ReduxStore } from "@/app/store/reduxStore";
import { FakeAuthGateway } from "@/app/adapters/secondary/gateways/fake/fakeAuthGateway";
import {loginRequested, onGoogleAuthFactory} from "@/app/core-logic/use-cases/auth/onGoogleAuth";


// (si tu es en ESM, dé-commente la ligne suivante)
// import { jest } from '@jest/globals';

describe("On Google Oauth authentication, ", () => {
    let store: ReduxStore;
    let authGateway: FakeAuthGateway;

    beforeEach(() => {
        jest.useFakeTimers();
        authGateway = new FakeAuthGateway();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    const createListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) =>
        onGoogleAuthFactory(authGateway, () => {
            try {doExpect();resolve({});} catch (e) {reject(e);
            }});

    const createStoreWithListener = (
        doExpect: () => void,
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void,
    ) =>
        initReduxStore({
            gateways: { authGateway },
            listeners: [createListener(doExpect, resolve, reject).middleware],
        });

    it('should, at the beginning change status to "authenticating" then "authenticated"', () => {
        return new Promise((resolve, reject) => {
            store = createStoreWithListener(
                () => {
                    const s = store.getState().authState.authData;
                    expect(s.status).toBe("authenticated");
                    expect(s.user).toEqual(authGateway.users['google:demo']);
                },
                resolve,
                reject,
            );

            store.dispatch(loginRequested("google"));

            expect(store.getState().authState.authData.status).toBe("authenticating");

            jest.advanceTimersByTime(2300);
        });
    });

    it('should set status to error if gateway fails', () => {
        (authGateway as any).willFail = true;

        return new Promise((resolve, reject) => {
            store = createStoreWithListener(
                () => {
                    const s = store.getState().authState.authData;
                    expect(s.status).toBe("error");
                    expect(s.error).toBe("PROVIDER_ERROR");
                },
                resolve,
                reject,
            );

            store.dispatch(loginRequested("google"));
            expect(store.getState().authState.authData.status).toBe("authenticating");
            jest.advanceTimersByTime(2300);
        });
    });
});
