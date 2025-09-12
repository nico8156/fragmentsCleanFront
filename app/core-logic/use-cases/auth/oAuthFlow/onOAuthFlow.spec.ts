import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {loginWithGoogleRequested} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";
import {oAuthServerGateway} from "@/app/core-logic/gateways/oAuthServerGateway";
import {oAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import {FakeServerOAuth} from "@/app/adapters/secondary/gateways/fake/fakeServerOAuth";
import {FakeGoogleOAuth} from "@/app/adapters/secondary/gateways/fake/fakeGoogleOAuth";

describe('onOAuthFlow', () => {
  let store: ReduxStore;
  let oAuthServerGateway: oAuthServerGateway;
  let oAuthGoogleGateway: oAuthGoogleGateway;

  beforeEach(() => {
    oAuthServerGateway = new FakeServerOAuth();
    oAuthGoogleGateway = new FakeGoogleOAuth();
    store = initReduxStore({gateways: {oAuthServerGateway, oAuthGoogleGateway}});
  })

  it('should update state to authenticating when flow begins', async() => {
    const pending = store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("authenticating");
    await pending;
    expect(store.getState().authState.status).toEqual("authenticated");
    expect(store.getState().authState.user).toEqual(aUser);
  });
});

const aUser = {
  id: "fake-user-id",
  name: "fake-user-name",
  email: "fake-user-email",
  picture: "fake-user-picture",
}