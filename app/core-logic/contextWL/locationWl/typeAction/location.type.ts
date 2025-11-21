export type LocationCoords = { lat: number; lng: number; accuracy?: number; heading?: number|null; speed?: number|null };

export interface LocationSubscription { remove(): void; }

type Status = 'idle'|'watching'|'paused'|'error';

export type AccuracyKey = 'low' | 'balanced' | 'high';

export interface LocationStateWl {
    coords: LocationCoords | null;
    lastUpdated: number | null;
    status: Status;
    permission: 'granted'|'denied'|'undetermined';
    error?: string;
    isWatching: boolean;
    nearbyCafeId?: string;
    nearbyDistanceMeters?: number;
    nearbyHistory: NearbyCafeVisit[];
}

export interface NearbyCafeVisit {
    cafeId: string;
    firstSeenAt: number;
    lastSeenAt: number;
    count: number;
}