import {LocationProvider} from "@/app/adapters/secondary/gateways/fake/FakeLocationProvider";
import { GeoPoint } from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import * as Location from 'expo-location';

export class PhoneLocationProvider implements LocationProvider {
    async localizeUserPhone(): Promise<GeoPoint> {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return {
                lat:0,
                lon:0};
        }
        let location = await Location.getCurrentPositionAsync({});

        return {
            lat:location.coords.latitude,
            lon:location.coords.longitude
        }
    }

}