import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {loginWithGoogleRequested} from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";
import {FakeServerOAuth} from "@/app/adapters/secondary/gateways/fake/fakeServerOAuth";
import {FakeGoogleOAuth} from "@/app/adapters/secondary/gateways/fake/fakeGoogleOAuth";
import {FakeSecureStoreGateway} from "@/app/adapters/secondary/gateways/fake/fakeSecureStoreGateway";

describe('On OAuth Flow', () => {

  let store: ReduxStore;
  let oAuthServerGateway: FakeServerOAuth;
  let oAuthGoogleGateway: FakeGoogleOAuth;
  let secureStorageGateway: FakeSecureStoreGateway;

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

  //ERRORS

  it('should update state to error when init from server fails with relevant authError states', async () => {
    oAuthServerGateway.willFailInit = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("initOAuth");
    expect(store.getState().authState.error?.message).toEqual("server_error_init");
  })
  it('should update state to error when google requested for code with relevant authError states', async () => {
    oAuthGoogleGateway.willFailCode = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("google");
    expect(store.getState().authState.error?.message).toEqual("google_server_error_code");
  })
  it('should update state to error when server fails to send back tokens with relevant authError states', async () => {
    oAuthServerGateway.willFailToken= true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("getAccessToken");
    expect(store.getState().authState.error?.message).toEqual("server_error_token");
  })
  it('should update state to error when secure storage fails with relevant authError states', async () => {
    secureStorageGateway.willFailStorageSet = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("storage");
    expect(store.getState().authState.error?.message).toEqual("Failed to set item");
  })
  it('should update state to error when secure storage fails and delete all values', async () => {
    secureStorageGateway.willFailStorageSet = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("storage");
    expect(store.getState().authState.error?.message).toEqual("Failed to set item");
    await expect(secureStorageGateway.getItemAsync("accessToken")).resolves.toBeNull();
    await expect(secureStorageGateway.getItemAsync("refreshToken")).resolves.toBeNull();
  })
  it('should update state to error when state value from google does not match server s stateId value', async () => {
    oAuthGoogleGateway.willSendWrongState = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("google");
    expect(store.getState().authState.error?.message).toEqual("OAuth state mismatch");
  })
  it('should update state to error when google s response s type not success', async () => {
    oAuthGoogleGateway.willSendDismissType = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("google");
    expect(store.getState().authState.error?.message).toEqual("user cancelled");
  })
  it('should update state to error when google s response s type not success and not dismiss', async () => {
    oAuthGoogleGateway.willSendOtherType = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("google");
    expect(store.getState().authState.error?.message).toEqual("provider error");
  })
  it('should update udpate state to error when google s response s code is null', async () => {
    oAuthGoogleGateway.wontSendCode = true;
    await store.dispatch(loginWithGoogleRequested());
    expect(store.getState().authState.status).toEqual("error");
    expect(store.getState().authState.error?.step).toEqual("google");
    expect(store.getState().authState.error?.message).toEqual("No authorization code returned by Google");
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