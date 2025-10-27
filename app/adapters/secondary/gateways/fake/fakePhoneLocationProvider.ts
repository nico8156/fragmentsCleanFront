import {LocationProvider} from "@/app/adapters/secondary/gateways/fake/FakeLocationProvider";
import { GeoPoint } from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";

export class FakePhoneLocationProvider implements LocationProvider {
    async localizeUserPhone(): Promise<GeoPoint> {

        return {
            lat: 48.117,
            lon: -1.678
        }
    }

}