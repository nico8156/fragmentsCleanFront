import { GeoPoint } from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {LocationWlGateway} from "@/app/contextWL/locationWl/gateway/location.gateway";
import {LocationProvider} from "@/app/adapters/secondary/gateways/fake/FakeLocationProvider";

export class FakeLocationWlGateway implements LocationWlGateway {
    constructor(private readonly provider : LocationProvider ) {}
    get = async (): Promise<GeoPoint> => {
        const coordinates = this.provider.localizeUserPhone()
        return coordinates;
    }
}