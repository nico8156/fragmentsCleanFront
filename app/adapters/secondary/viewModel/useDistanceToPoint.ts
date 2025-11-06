// hooks/useDistanceToPoint.ts
import { useMemo } from 'react';
import {useUserLocationFromStore} from "@/app/adapters/secondary/viewModel/useUserLocation";
import {formatDistance, haversineKm} from "@/app/core-logic/utils/geo/distance";


type LatLng = { lat: number; lng: number };

export function useDistanceToPoint(target?: LatLng | undefined, locale = 'fr-FR') {
    const { coords } = useUserLocationFromStore(); // {lat,lng} | null

    const value = useMemo(() => {
        if (!coords || !target) return { km: null as number|null, text: undefined as string|undefined };
        const km = haversineKm(coords.lat, coords.lng, target.lat, target.lng);
        const text = formatDistance(km, locale); // ex: "1,2 km" ou "230 m"
        return { km, text };
    }, [coords?.lat, coords?.lng, target?.lat, target?.lng, locale]);
    console.log("useDistanceToPoint", value);
    return {
        hasLocation: Boolean(coords && target),
        km: value.km,            // number | null
        text: value.text,        // string | undefined
    } as const;
}
