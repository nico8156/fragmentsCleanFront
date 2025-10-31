import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {DependenciesWl} from "@/app/store/appStateWl";
import {userLocationListenerFactory} from "./userLocationFactory";
import {
    getOnceRequested,
    permissionCheckRequested,
    requestPermission,
    startWatchRequested,
    stopWatchRequested,
} from "@/app/core-logic/contextWL/locationWl/typeAction/location.action";
import {LocationWlGateway} from "@/app/core-logic/contextWL/locationWl/gateway/location.gateway";
import {AccuracyKey, LocationCoords} from "@/app/core-logic/contextWL/locationWl/typeAction/location.type";
import {FakeLocationGateway} from "@/app/adapters/secondary/gateways/fake/fakeLocationWlGateway";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('userLocationListenerFactory', () => {
    let store: ReduxStoreWl;
    let gateway: FakeLocationGateway;

    const getLocationState = () => store.getState().lcState;

    beforeEach(() => {
        gateway = new FakeLocationGateway();
        const dependencies: DependenciesWl = {
            gateways: { locations: gateway },
            helpers: {},
        };
        store = initReduxStoreWl({
            dependencies,
            listeners: [userLocationListenerFactory(dependencies)],
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should update permission state when permission check succeeds', async () => {
        store.dispatch(permissionCheckRequested());
        await flush();

        expect(gateway.getPermissionStatus).toHaveBeenCalledTimes(1);
        expect(getLocationState().permission).toBe('granted');
        expect(getLocationState().status).toBe('idle');
        expect(getLocationState().error).toBeUndefined();
    });

    it('should expose an error when permission check fails', async () => {
        gateway.getPermissionShouldFail = true;
        gateway.permissionErrorMessage = 'unable to check permission';

        store.dispatch(permissionCheckRequested());
        await flush();

        expect(getLocationState().status).toBe('error');
        expect(getLocationState().error).toBe('unable to check permission');
    });

    it('should request permission and persist the result', async () => {
        store.dispatch(requestPermission());
        await flush();

        expect(gateway.requestPermission).toHaveBeenCalledTimes(1);
        expect(getLocationState().permission).toBe('granted');
        expect(getLocationState().status).toBe('idle');
    });

    it('should expose an error when permission request fails', async () => {
        gateway.requestPermissionShouldFail = true;
        gateway.requestPermissionErrorMessage = 'permission denied by user';

        store.dispatch(requestPermission());
        await flush();

        expect(getLocationState().status).toBe('error');
        expect(getLocationState().error).toBe('permission denied by user');
    });

    it('should retrieve the current location once when requested', async () => {
        const coords: LocationCoords = { lat: 43.6, lng: 3.88, accuracy: 8, heading: null, speed: null };
        gateway.nextCoords = coords;
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_696_969_696);

        store.dispatch(getOnceRequested({ accuracy: 'high' }));
        await flush();

        expect(gateway.getCurrentPosition).toHaveBeenCalledWith({ accuracy: 'high' });
        expect(getLocationState().coords).toEqual(coords);
        expect(getLocationState().lastUpdated).toBe(1_696_969_696);
        expect(getLocationState().status).toBe('idle');
        expect(getLocationState().error).toBeUndefined();

        nowSpy.mockRestore();
    });

    it('should expose an error when retrieving the current location fails', async () => {
        gateway.getCurrentPositionShouldFail = true;
        gateway.getCurrentPositionErrorMessage = 'gps unavailable';

        store.dispatch(getOnceRequested({ accuracy: 'low' }));
        await flush();

        expect(gateway.getCurrentPosition).toHaveBeenCalledWith({ accuracy: 'low' });
        expect(getLocationState().status).toBe('error');
        expect(getLocationState().error).toBe('gps unavailable');
    });

    it('should start watching the position and propagate updates', async () => {
        const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(10);

        store.dispatch(startWatchRequested({ accuracy: 'balanced', distanceInterval: 25, timeInterval: 2000 }));
        await flush();

        expect(gateway.watchPosition).toHaveBeenCalledTimes(1);
        expect(gateway.lastWatchOptions).toEqual({ accuracy: 'balanced', distanceInterval: 25, timeInterval: 2000 });
        expect(getLocationState().isWatching).toBe(true);
        expect(getLocationState().status).toBe('watching');

        const updatedCoords: LocationCoords = { lat: 12.34, lng: 56.78, accuracy: 3, heading: null, speed: null };
        nowSpy.mockReturnValue(42);
        gateway.emitWatchUpdate(updatedCoords);
        await flush();

        expect(getLocationState().coords).toEqual(updatedCoords);
        expect(getLocationState().lastUpdated).toBe(42);
        expect(getLocationState().status).toBe('watching');
        expect(getLocationState().error).toBeUndefined();

        nowSpy.mockRestore();
    });

    it('should expose an error when starting to watch fails', async () => {
        gateway.watchShouldFail = true;
        gateway.watchFailureMessage = 'cannot start watch';

        store.dispatch(startWatchRequested({ accuracy: 'balanced' }));
        await flush();

        expect(gateway.watchPosition).toHaveBeenCalledTimes(1);
        expect(getLocationState().status).toBe('error');
        expect(getLocationState().error).toBe('cannot start watch');
        expect(getLocationState().isWatching).toBe(false);
    });

    it('should expose an error coming from the watch callback', async () => {
        store.dispatch(startWatchRequested({accuracy:"balanced"}));
        await flush();

        gateway.emitWatchError('network lost');
        await flush();

        expect(getLocationState().status).toBe('error');
        expect(getLocationState().error).toBe('network lost');
    });

    it('should stop the watch and remove the subscription', async () => {
        store.dispatch(startWatchRequested({accuracy:"balanced"}));
        await flush();

        store.dispatch(stopWatchRequested());
        await flush();

        expect(gateway.watchRemoveSpy).toHaveBeenCalledTimes(1);
        expect(getLocationState().isWatching).toBe(false);
        expect(getLocationState().status).toBe('paused');
    });
});
