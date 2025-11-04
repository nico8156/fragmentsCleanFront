import {
    Address,
    CoffeeId,
    GeoPoint,
    parseToCoffeeId
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
    googleId:string;
    name: string;
    location: GeoPoint;
    address: Address;
    phoneNumber:string;
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
    (s:RootStateWl) => selectHoursByDayVM(id, s)],
    (coffee, photos, openingHours) :CafeFullVM |undefined=> {
        if(!coffee) return undefined;
        const photosVM = photos ?? ["https://images.unsplash.com/photo-1761026532879-0b5301cca459?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzOXx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=900"]

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

//TODO handle opening hours : indicator OPEN / CLOSE => domain = pure = NO CHANGE
//TODO calculate distance coffee == user