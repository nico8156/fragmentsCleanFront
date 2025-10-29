import {LocationWlGateway} from "@/app/contextWL/locationWl/gateway/location.gateway";
import {AccuracyKey, LocationCoords, LocationSubscription} from "@/app/contextWL/locationWl/typeAction/location.type";
import * as ExpoLocation from 'expo-location';

export class ExpoLocationGateway implements LocationWlGateway {
    async getPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
        const s = await ExpoLocation.getForegroundPermissionsAsync();
        console.log(s);
        if (s.granted) return 'granted';
        return s.canAskAgain ? 'undetermined' : 'denied';
    }
    async requestPermission(): Promise<"granted" | "denied"> {
        const s = await ExpoLocation.requestForegroundPermissionsAsync();
        return s.granted ? 'granted' : 'denied';
    }
    async getCurrentPosition(options?: { accuracy?:AccuracyKey }): Promise<LocationCoords> {
        const accMap = {
            low: ExpoLocation.Accuracy.Lowest,
            balanced: ExpoLocation.Accuracy.Balanced,
            high: ExpoLocation.Accuracy.Highest,
        } as const;
        const key: AccuracyKey = options?.accuracy ?? 'balanced';
        const acc = accMap[key];
        const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: acc });
        return toCoords(loc);
    }
    async watchPosition(options: { accuracy?: "balanced"; distanceInterval?: number; timeInterval?: number; }, onUpdate: (coords: LocationCoords) => void, onError?: (err: unknown) => void): Promise<LocationSubscription> {
        const accMap = {
             low: ExpoLocation.Accuracy.Lowest,
            balanced: ExpoLocation.Accuracy.Balanced,
            high: ExpoLocation.Accuracy.Highest,
        } as const;
        const sub = await ExpoLocation.watchPositionAsync(
            {
                accuracy: accMap[options?.accuracy ?? 'balanced'],
                distanceInterval: options?.distanceInterval ?? 50,
                timeInterval: options?.timeInterval,
                mayShowUserSettingsDialog: false,
            },
            (loc) => onUpdate(toCoords(loc)),
            onError
        );
        return { remove: () => sub.remove() } as LocationSubscription;
    }
}
function toCoords(loc: ExpoLocation.LocationObject): LocationCoords {
    return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
        heading: loc.coords.heading ?? null,
        speed: loc.coords.speed ?? null,
    };
}