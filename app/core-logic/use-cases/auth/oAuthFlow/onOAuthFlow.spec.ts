import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {loginWithGoogleRequested} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

describe('onOAuthFlow', () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({gateways: {}});
  })

  it('should update state to authenticating when flow begins', async() => {
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("authenticating");
  });
});