import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/app/contextWL/userWl/reducer/user.reducer";
import {
    authListenerFactory,
} from "@/app/contextWL/userWl/usecases/auth/authListenersFactory";
import { signInWithProvider, initializeAuth, signOut } from "@/app/contextWL/userWl/usecases/auth/authUsecases";
import { FakeOAuthGateway } from "@/app/adapters/secondary/gateways/fake/fakeOAuthGateway";
import { FakeAuthSecureStore } from "@/app/adapters/secondary/gateways/fake/fakeAuthSecureStore";
import { FakeUserRepo, makeDemoUser } from "@/app/adapters/secondary/gateways/fake/fakeUserRepo";
import { FakeAuthServerGateway } from "@/app/adapters/secondary/gateways/fake/fakeAuthServerGateway";
import { AuthSession } from "@/app/contextWL/userWl/typeAction/user.type";
import {initReduxStoreWl} from "@/app/store/reduxStoreWl";
import any = jasmine.any;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const createTestStore = (deps: any) => {

    return initReduxStoreWl({
        dependencies: deps,
        listeners: [authListenerFactory(deps)],
    });
};

describe("auth flow", () => {
    it("signs in through OAuth gateway and hydrates user", async () => {
        const oauth = new FakeOAuthGateway();
        const secureStore = new FakeAuthSecureStore();
        const userRepo = new FakeUserRepo([makeDemoUser()]);
        const deps = {
            gateways: {
                auth: { oauth, secureStore, userRepo },
            },
            helpers: {},
        };
        const store = createTestStore(deps);

        store.dispatch<any>(signInWithProvider({ provider: "google" }));
        await flush();

        const state = store.getState().aState;
        expect(state.status).toBe("signedIn");
        expect(state.session?.provider).toBe("google");
        expect(state.session?.tokens).toEqual(
            expect.objectContaining({ tokenType: "Bearer" }),
        );
        // Access token should not be exposed in redux snapshot
        expect((state.session as any)?.tokens?.accessToken).toBeUndefined();
        expect(secureStore.snapshot()).toBeDefined();
        expect(state.currentUser?.displayName).toBe("Fake User");
    });

    it("loads session from secure store on boot", async () => {
        const oauth = new FakeOAuthGateway();
        const secureStore = new FakeAuthSecureStore();
        const userRepo = new FakeUserRepo([makeDemoUser()]);
        const session: AuthSession = {
            userId: makeDemoUser().id,
            provider: "google",
            scopes: ["openid"],
            establishedAt: Date.now() - 1000,
            tokens: {
                accessToken: "stored-token",
                expiresAt: Date.now() + 60 * 60 * 1000,
                tokenType: "Bearer",
            },
        };
        await secureStore.saveSession(session);
        const deps = {
            gateways: {
                auth: { oauth, secureStore, userRepo },
            },
            helpers: {},
        };
        const store = createTestStore(deps);

        store.dispatch<any>(initializeAuth());
        await flush();

        const state = store.getState().aState;
        expect(state.status).toBe("signedIn");
        expect(state.session?.provider).toBe("google");
        expect(state.currentUser?.id).toBe(session.userId);
    });

    it("refreshes session via backend when tokens about to expire", async () => {
        const oauth = new FakeOAuthGateway();
        const secureStore = new FakeAuthSecureStore();
        const userRepo = new FakeUserRepo([makeDemoUser()]);
        const authServer = new FakeAuthServerGateway(2 * 60 * 60 * 1000);
        const session: AuthSession = {
            userId: makeDemoUser().id,
            provider: "google",
            scopes: ["openid"],
            establishedAt: Date.now(),
            tokens: {
                accessToken: "soon-expiring",
                expiresAt: Date.now() + 30 * 1000,
                tokenType: "Bearer",
            },
        };
        await secureStore.saveSession(session);
        authServer.refreshedUser = makeDemoUser();
        const deps = {
            gateways: {
                auth: { oauth, secureStore, userRepo, server: authServer },
            },
            helpers: {},
        };
        const store = createTestStore(deps);

        store.dispatch<any>(initializeAuth());
        await flush();
        await flush();

        const state = store.getState().aState;
        expect(state.status).toBe("signedIn");
        expect(secureStore.snapshot()?.tokens.expiresAt).toBeGreaterThan(session.tokens.expiresAt);
    });

    it("clears session on sign out", async () => {
        const oauth = new FakeOAuthGateway();
        const secureStore = new FakeAuthSecureStore();
        const userRepo = new FakeUserRepo([makeDemoUser()]);
        const deps = {
            gateways: {
                auth: { oauth, secureStore, userRepo },
            },
            helpers: {},
        };
        const store = createTestStore(deps);

        store.dispatch<any>(signInWithProvider({ provider: "google" }));
        await flush();

        store.dispatch<any>(signOut());
        await flush();

        const state = store.getState().aState;
        expect(state.status).toBe("signedOut");
        expect(secureStore.snapshot()).toBeUndefined();
    });
});
