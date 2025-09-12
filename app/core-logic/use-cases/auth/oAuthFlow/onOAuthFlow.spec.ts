import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {loginWithGoogleRequested} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";
import {oAuthServerGateway} from "@/app/core-logic/gateways/oAuthServerGateway";
import {oAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import {FakeServerOAuth} from "@/app/adapters/secondary/gateways/fake/fakeServerOAuth";
import {FakeGoogleOAuth} from "@/app/adapters/secondary/gateways/fake/fakeGoogleOAuth";
import {SecureStoreGateway} from "@/app/core-logic/gateways/secureStoreGateway";
import {FakeSecureStoreGateway} from "@/app/adapters/secondary/gateways/fake/fakeSecureStoreGateway";

describe('On OAuth Flow', () => {
  let store: ReduxStore;
  let oAuthServerGateway: oAuthServerGateway;
  let oAuthGoogleGateway: oAuthGoogleGateway;
  let secureStorageGateway: SecureStoreGateway;

  beforeEach(() => {
    oAuthServerGateway = new FakeServerOAuth();
    oAuthGoogleGateway = new FakeGoogleOAuth();
    secureStorageGateway = new FakeSecureStoreGateway();
    store = initReduxStore({gateways: {oAuthServerGateway, oAuthGoogleGateway, secureStorageGateway}});
  })

  it('should update state to authenticating when flow begins', () => {
    store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("authenticating");

  });
  it('should update state to authenticated when flow ends and add user to the state', async() => {
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("authenticated");
    expect(store.getState().authState.user).toEqual(aUser);
  })
  it('should store token in secure storage', async () => {
    await store.dispatch(loginWithGoogleRequested());
    let token = await secureStorageGateway.getItemAsync("accessToken");
    let refreshToken = await secureStorageGateway.getItemAsync("refreshToken");
    expect(token).toEqual(aToken);
    expect(refreshToken).toEqual(aRefreshToken);
  })
});

const aUser = {
  id: "fake-user-id",
  name: "fake-user-name",
  email: "fake-user-email",
  picture: "fake-user-picture",
}

const aToken = "fake-access-token";

const aRefreshToken = "fake-refresh-token";