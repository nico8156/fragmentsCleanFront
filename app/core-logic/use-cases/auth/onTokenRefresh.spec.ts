import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {AuthGateway} from "@/app/core-logic/gateways/authGateway";
import {FakeAuthGateway} from "@/app/adapters/secondary/gateways/fakeAuthGateway";
import {loginSucceeded, onGoogleAuthFactory} from "@/app/core-logic/use-cases/auth/onGoogleAuth";
import {onTokenRefreshFactory} from "@/app/core-logic/use-cases/auth/onTokenRefresh";
import {logoutClicked} from "@/app/core-logic/use-cases/auth/onLogoutClicked";

describe('On Token Refresh, ', () => {
    let store: ReduxStore;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    })
    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    })

    it('Should plan a refresh after event login succeeded', () => {
        const now = Date.now();               // horloge figée
        const skewMs = 2_000;                 // marge
        const inMs = 10_000;                  // expiration dans 10s
        const expiresAt = now + inMs;

        const refresh = jest.fn().mockResolvedValue({
            accessToken: "new-acc",
            expiresAt: now + 3_600_000,
        });

        // espionne setTimeout (facultatif, on peut aussi faire jest.getTimerCount())
        const setTimeoutSpy = jest.spyOn(global, "setTimeout");

        store = initReduxStore({
            listeners: [onTokenRefreshFactory({ refresh, skewMs }).middleware],
        });

        // déclenche la planification
        store.dispatch(
            loginSucceeded({
                user: { id: "u", email: "e", name: "n", avatarUrl: "" },
                tokens: { accessToken: "acc", refreshToken: "ref", expiresAt },
            })
        );

        // un timer a été planifié
        expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

        const scheduledDelay = (setTimeoutSpy.mock.calls[0] as any[])[1] as number;
        expect(scheduledDelay).toBe(inMs - skewMs); // 10_000 - 2_000 = 8_000ms
    });

    it("Should trigger TOKENS_REFRESHED at countdown's ending", async () => {
        const now = Date.now();
        const skewMs = 1_000;
        const inMs = 5_000;
        const expiresAt = now + inMs;

        const refresh = jest.fn().mockResolvedValue({
            accessToken: "new-access",
            expiresAt: now + 3_600_000,
        });

        store = initReduxStore({
            listeners: [onTokenRefreshFactory({ refresh, skewMs }).middleware],
        });

        store.dispatch(
            loginSucceeded({
                user: { id: "u", email: "e", name: "n", avatarUrl: "" },
                tokens: { accessToken: "acc", refreshToken: "ref", expiresAt },
            })
        );

        // avance jusqu’au déclenchement (5_000 - 1_000 = 4_000ms)
        jest.advanceTimersByTime(inMs - skewMs);

        // laisse la micro-tâche (promesse du refresh) se résoudre
        await Promise.resolve();

        const s = store.getState().authState.authData;
        expect(refresh).toHaveBeenCalledWith("ref");
        expect(s.accessToken).toBe("new-access");
        expect(s.expiresAt).toBeGreaterThan(now); // mis à jour
    });

    it("should cancel refresh if LOGOUT_CLICKED before term", async () => {
        const now = Date.now();
        const skewMs = 1_000;
        const inMs = 8_000;
        const expiresAt = now + inMs;

        const refresh = jest.fn().mockResolvedValue({
            accessToken: "new-access",
            expiresAt: now + 3_600_000,
        });

        store = initReduxStore({
            listeners: [onTokenRefreshFactory({ refresh, skewMs }).middleware],
        });

        store.dispatch(
            loginSucceeded({
                user: { id: "u", email: "e", name: "n", avatarUrl: "" },
                tokens: { accessToken: "acc", refreshToken: "ref", expiresAt },
            })
        );

        // logout avant l’échéance
        store.dispatch(logoutClicked());

        // avance le temps jusqu’à et au-delà de l’échéance
        jest.advanceTimersByTime(inMs - skewMs);
        await Promise.resolve();

        expect(refresh).not.toHaveBeenCalled();

        const s = store.getState().authState.authData;
        expect(s.status).toBe("anonymous");  // si ton reducer reset sur logout
        expect(s.accessToken).toBeNull();
    });
})