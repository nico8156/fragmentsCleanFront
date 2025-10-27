import {GeoPoint} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";

export interface LocationProvider {
    localizeUserPhone(): Promise<GeoPoint>;
}