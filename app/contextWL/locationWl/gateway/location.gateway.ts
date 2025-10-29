import {AccuracyKey, LocationCoords, LocationSubscription} from "@/app/contextWL/locationWl/typeAction/location.type";

export type LocationWlGateway = {
    getPermissionStatus(): Promise<'granted'|'denied'|'undetermined'>;
    requestPermission(): Promise<'granted'|'denied'>;

    getCurrentPosition(options?: { accuracy?: AccuracyKey }): Promise<LocationCoords>;

    watchPosition(
        options: { accuracy?: 'balanced', distanceInterval?: number, timeInterval?: number },
        onUpdate: (coords: LocationCoords) => void,
        onError?: (err: unknown) => void
    ): Promise<LocationSubscription>;
}