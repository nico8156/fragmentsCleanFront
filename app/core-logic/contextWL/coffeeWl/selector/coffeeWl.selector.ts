import {
    Address, Coffee,
    CoffeeId,
    GeoPoint
} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import { createSelector } from "@reduxjs/toolkit";
import {selectPhotosForCoffeeId} from "@/app/core-logic/contextWL/cfPhotosWl/selector/cfPhoto.selector";
import {
    selectHoursByDayVM
} from "@/app/core-logic/contextWL/openingHoursWl/selector/openingHours.selector";
import {HoursByDayVM} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export type CafeFullVM = {
    id: CoffeeId | string;
    googleId?:string;
    name: string;
    location: GeoPoint;
    address: Address;
    phoneNumber?:string;
    website?:string;
    rating?: number;     // optionnel (avg)
    tags?: string[];     // ex: ["espresso", "filter", "roaster"] FAIRE feature plus tard !
    photos: string[];
    hours: HoursByDayVM; // ex: weekday_description
    isOpenNow?: boolean; // si tu calcules côté adapter
};

export type CoffeeOnMap = {
    id: CoffeeId | string
    name: string;
    location: GeoPoint;
}

const selectCoffeeForId = (id:CoffeeId,state:RootStateWl) => state.cfState.byId[id];
const selectLocationForCoffee = (id:CoffeeId) => (state:RootStateWl) => state.cfState.byId[id].location;
const allCoffeesId = (state: RootStateWl) => state.cfState.ids;
const allById = (state: RootStateWl) => state.cfState.byId

export const selectCoffeeFullVM = (id:CoffeeId) => createSelector(
    [(s:RootStateWl) => selectCoffeeForId(id,s),
    (s:RootStateWl) => selectPhotosForCoffeeId(id,s),
    (s:RootStateWl) => selectHoursByDayVM(s,id )],
    (coffee, photos, openingHours) :CafeFullVM |undefined=> {
        if(!coffee) return undefined;
        const photosVM = photos ?? [];

        return {
            ...coffee,
            photos: photosVM,
            hours: openingHours
        }
    }
)

export const selectViewForMarkers = createSelector(
    (s:RootStateWl) => allCoffeesId(s),
    (s:RootStateWl) => allById(s),
    (ids, byId) => {
        const result = [] as CoffeeOnMap[]
        ids.map(id => {
            const coffee = byId[id];
            result.push ({
                id: coffee.id,
                name: coffee.name,
                location: coffee.location,
            })
        })
        return result;
    }
)


export const selectCoordinatesForCoffee = (id:CoffeeId) => createSelector(
    (s:RootStateWl) => selectLocationForCoffee(id)(s),
    (location) => location
)

export const selectCoffeesList = createSelector(
    [allById],
    (byId): Coffee[] => Object.values(byId)
);

//TODO handle opening hours : indicator OPEN / CLOSE => domain = pure = NO CHANGE
//TODO calculate distance coffee == user
