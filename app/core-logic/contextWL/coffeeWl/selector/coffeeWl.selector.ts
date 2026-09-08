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
import { DayWindow } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";
import { CoffeeDiscoveryState } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { isOpenNowFromWindows } from "@/app/core-logic/utils/time/isOpeningNow";
import { formatDistance, haversineKm } from "@/app/core-logic/utils/geo/distance";

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

export type DiscoveryCoffeeVM = CoffeeOnMap & {
    city?: string;
    tags: string[];
    distanceKm: number | null;
    distanceText?: string;
    isOpenNow?: boolean;
    hasPhoto: boolean;
};

const defaultDiscovery: CoffeeDiscoveryState = {
    query: "", onlyOpenNow: false, onlyWithPhotos: false, requiredTags: [], sort: "distance"
};

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

export const selectCoffeeDiscovery = (state: RootStateWl) => state.cfState.discovery ?? defaultDiscovery;

export function buildCoffeeDiscoveryResults(input: {
    coffees: Coffee[];
    photosByCoffeeId: Record<string, string[]>;
    hoursByCoffeeId: Record<string, DayWindow[]>;
    hoursStatusByCoffeeId: Record<string, "idle" | "loading" | "ok" | "error">;
    userCoords: { lat: number; lng: number } | null;
    discovery: CoffeeDiscoveryState;
    now?: Date;
}): DiscoveryCoffeeVM[] {
    const normalizedQuery = normalizeDiscoveryText(input.discovery.query);
    const requiredTags = input.discovery.requiredTags.map(normalizeDiscoveryText).filter(Boolean);
    const now = input.now ?? new Date();
    const results = input.coffees.map((coffee) => {
        const id = String(coffee.id);
        const hasPhoto = (input.photosByCoffeeId[id] ?? []).length > 0;
        const hoursLoaded = input.hoursStatusByCoffeeId[id] === "ok";
        const isOpenNow = hoursLoaded ? isOpenNowFromWindows(input.hoursByCoffeeId[id], now) : undefined;
        const distanceKm = input.userCoords
            ? haversineKm(input.userCoords.lat, input.userCoords.lng, coffee.location.lat, coffee.location.lon)
            : null;
        return {
            id: coffee.id,
            name: coffee.name,
            location: coffee.location,
            city: coffee.address.city,
            tags: coffee.tags ?? [],
            distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
            distanceText: distanceKm !== null && Number.isFinite(distanceKm) ? formatDistance(distanceKm) : undefined,
            isOpenNow,
            hasPhoto
        } satisfies DiscoveryCoffeeVM;
    }).filter((coffee) => {
        const searchable = normalizeDiscoveryText([coffee.name, coffee.city, ...coffee.tags].filter(Boolean).join(" "));
        if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
        if (input.discovery.onlyOpenNow && coffee.isOpenNow !== true) return false;
        if (input.discovery.onlyWithPhotos && !coffee.hasPhoto) return false;
        return requiredTags.every((tag) => coffee.tags.some((coffeeTag) => normalizeDiscoveryText(coffeeTag) === tag));
    });

    return results.sort((left, right) => {
        if (input.discovery.sort === "distance") {
            const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
            const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;
        }
        return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
    });
}

export const selectCoffeeDiscoveryInputs = createSelector(
    [
        selectCoffeesList,
        (state: RootStateWl) => state.pState.byCoffeeId,
        (state: RootStateWl) => state.ohState.byCoffeeIdDayWindow,
        (state: RootStateWl) => state.ohState.statusByCoffeeId,
        (state: RootStateWl) => state.lcState.coords,
        (state: RootStateWl) => state.cfState.requests.list.status,
        selectCoffeeDiscovery
    ],
    (coffees, photosByCoffeeId, hoursByCoffeeId, hoursStatusByCoffeeId, userCoords, catalogueStatus, discovery) => ({
        coffees, photosByCoffeeId, hoursByCoffeeId, hoursStatusByCoffeeId, userCoords, catalogueStatus, discovery
    })
);

function normalizeDiscoveryText(value: string | undefined) {
    return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("fr-FR");
}
