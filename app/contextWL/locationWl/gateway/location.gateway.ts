import {GeoPoint} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";

export type LocationWlGateway = {
    get: () => Promise<GeoPoint>
}