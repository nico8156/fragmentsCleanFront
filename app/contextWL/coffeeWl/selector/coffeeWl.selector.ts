import {Address, CoffeeId, GeoPoint} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";
import { createSelector } from "@reduxjs/toolkit";
import {selectPhotosForCoffeeId} from "@/app/contextWL/cfPhotosWl/selector/cfPhoto.selector";
import {
    selectHoursByDayVM
} from "@/app/contextWL/openingHoursWl/selector/openingHours.selector";
import {HoursByDayVM} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.type";

export type CafeFullVM = {
    id: CoffeeId | string;
    googleId:string;
    name: string;
    location: GeoPoint;
    address: Address;
    phoneNumber:string;
    website?:string;
    rating?: number;     // optionnel (avg)
    tags?: string[];     // ex: ["espresso", "filter", "roaster"]
    photos: string[];
    hours: HoursByDayVM; // ex: weekday_description
    isOpenNow?: boolean; // si tu calcules côté adapter
};

const selectCoffeeForId = (id:CoffeeId) => (state:RootStateWl) => state.cfState.byId[id];
const selectLocationForCoffee = (id:CoffeeId) => (state:RootStateWl) => state.cfState.byId[id].location;

export const selectCoffeeFullVM = (id:CoffeeId) => createSelector(
    (s:RootStateWl) => selectCoffeeForId(id)(s),
    (s:RootStateWl) => selectPhotosForCoffeeId(id)(s),
    (s:RootStateWl) => selectHoursByDayVM(id)(s),
    (coffee, photos, openingHours) => {
        if(!coffee) return undefined;
        const photosVM = photos ?? ["https://images.unsplash.com/photo-1761026532879-0b5301cca459?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzOXx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=900"]

        return {
            ...coffee,
            photos: photosVM,
            hours: openingHours
        }
    }
)


export const selectCoordinatesForCoffee = (id:CoffeeId) => createSelector(
    (s:RootStateWl) => selectLocationForCoffee(id)(s),
    (location) => location
)

//TODO handle opening hours : indicator OPEN / CLOSE => domain = pure = NO CHANGE
//TODO calculate distance coffee == user