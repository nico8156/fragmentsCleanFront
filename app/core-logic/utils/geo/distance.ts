// 1) Calcul pur (km)
import {Coffee} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    //Use of Haversine formula ...
    // check all params are numbers
    if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || Number.isNaN(v))) {
        return NaN;
    }
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371; // km

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.max(0, R * c); // clamp à 0 pour éviter -0 dû aux flottants
}

export function findClosestCafeWithinRadius(pos:{lat:number, lng:number},cafes:Coffee[],radius:number):any{
    let best: { cafeId: string; distanceMeters: number } | undefined;

    for (const cafe of cafes) {

        const d = haversineKm(pos.lat, pos.lng, cafe.location.lat, cafe.location.lon);

        if (d <= radius && (!best || d < best.distanceMeters)) {
            best = { cafeId: cafe.id, distanceMeters: d };
        }
    }

    return best;
}

// 2) Formatage (retourne une string localisée)
export function formatDistance(distanceKm: number, locale = 'fr-FR'): string {
    if (!Number.isFinite(distanceKm)) return '';
    if (distanceKm < 1) {
        // mètres, arrondi au mètre (tu peux passer au 10 m si besoin)
        const m = Math.round(distanceKm * 1000);
        return new Intl.NumberFormat(locale).format(m) + ' m';
    }
    // km, 1 décimale
    const km = Math.round(distanceKm * 10) / 10;
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(km) + ' km';
}

// 3) Helper combiné (API proche de la tienne)
export function calculateDistanceFromUser(
    lat1: number, lon1: number, lat2: number, lon2: number, locale = 'fr-FR'
): string {
    const d = haversineKm(lat1, lon1, lat2, lon2);
    return formatDistance(d, locale);
}
