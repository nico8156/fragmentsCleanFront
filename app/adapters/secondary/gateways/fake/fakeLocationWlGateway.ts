import {LocationWlGateway} from "@/app/core-logic/contextWL/locationWl/gateway/location.gateway";
import {AccuracyKey, LocationCoords} from "@/app/core-logic/contextWL/locationWl/typeAction/location.type";

export class FakeLocationGateway implements LocationWlGateway {
    permissionStatus: 'granted' | 'denied' | 'undetermined' = 'granted';
    requestPermissionStatus: 'granted' | 'denied' = 'granted';
    nextCoords: LocationCoords = { lat: 48.8566, lng: 2.3522, accuracy: 5, heading: null, speed: null };

    permissionErrorMessage = 'permission check failed';
    requestPermissionErrorMessage = 'permission request failed';
    getCurrentPositionErrorMessage = 'current position failed';
    watchFailureMessage = 'watch failed to start';

    getPermissionShouldFail = false;
    requestPermissionShouldFail = false;
    getCurrentPositionShouldFail = false;
    watchShouldFail = false;

    lastGetCurrentOptions?: { accuracy?: AccuracyKey };
    lastWatchOptions?: { accuracy?: 'balanced'; distanceInterval?: number; timeInterval?: number };
    private watchUpdateHandler?: (coords: LocationCoords) => void;
    private watchErrorHandler?: (err: unknown) => void;
    watchRemoveSpy = jest.fn();

    getPermissionStatus = jest.fn(async () => {
        if (this.getPermissionShouldFail) {
            throw new Error(this.permissionErrorMessage);
        }
        return this.permissionStatus;
    });

    requestPermission = jest.fn(async () => {
        if (this.requestPermissionShouldFail) {
            throw new Error(this.requestPermissionErrorMessage);
        }
        return this.requestPermissionStatus;
    });

    getCurrentPosition = jest.fn(async (options?: { accuracy?: AccuracyKey }) => {
        this.lastGetCurrentOptions = options;
        if (this.getCurrentPositionShouldFail) {
            throw new Error(this.getCurrentPositionErrorMessage);
        }
        return this.nextCoords;
    });

    watchPosition = jest.fn(async (
        options: { accuracy?: 'balanced'; distanceInterval?: number; timeInterval?: number },
        onUpdate: (coords: LocationCoords) => void,
        onError?: (err: unknown) => void,
    ) => {
        this.lastWatchOptions = options;
        this.watchUpdateHandler = onUpdate;
        this.watchErrorHandler = onError;
        if (this.watchShouldFail) {
            throw new Error(this.watchFailureMessage);
        }
        return { remove: this.watchRemoveSpy };
    });

    emitWatchUpdate(coords: LocationCoords = this.nextCoords) {
        this.watchUpdateHandler?.(coords);
    }

    emitWatchError(error: unknown = 'watch callback error') {
        this.watchErrorHandler?.(error);
    }
}