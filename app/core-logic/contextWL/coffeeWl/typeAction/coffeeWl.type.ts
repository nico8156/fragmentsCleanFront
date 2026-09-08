// Types "brandés"
export type ISODate = string & { readonly __brand: "ISODate" };
export type CoffeeId = string & { readonly __brand: "CoffeeId" };

export function parseToISODate(date: string): ISODate {
    return date as ISODate;
}

export function parseToCoffeeId(id: string): CoffeeId {
    return id as CoffeeId;
}

// Géo & adresse minimalistes
export interface GeoPoint {
    lat: number;
    lon: number;
}

export interface Address {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string; // "FR", ...
}

// Entité Café (read model)
export interface Coffee {
    id: CoffeeId | string;
    googleId?:string;
    name: string;
    location: GeoPoint;
    address: Address;
    phoneNumber?:string;
    website?:string;
    rating?: number;     // optionnel (avg)
    tags?: string[];     // ex: ["espresso", "filter", "roaster"]
    version: number;     // version serveur
    updatedAt: ISODate;  // maj côté serveur
}

export type CoffeeDiscoverySort = "distance" | "relevance";

/**
 * Préférences de découverte locales. Elles ne modifient jamais le catalogue
 * serveur : elles composent la projection publique, y compris hors ligne.
 */
export interface CoffeeDiscoveryState {
    query: string;
    onlyOpenNow: boolean;
    onlyWithPhotos: boolean;
    requiredTags: string[];
    sort: CoffeeDiscoverySort;
}

// Slice state
export interface CoffeeStateWl {
    byId: Record<string, Coffee>;
    ids: string[]; // ordre global par défaut
    // (optionnel) indexes simples
    byCity?: Record<string, string[]>; // city -> [ids]
	/** Etat d'intention UI, séparé des entités et du cycle réseau. */
	discovery?: CoffeeDiscoveryState;
	requests: {
			byId: Record<string, { status: "idle" | "loading" | "success" | "error"; error?: string; etag?: string }>;
		list: {
			status: "idle" | "loading" | "success" | "error";
			error?: string;
			etag?: string;
			lastSuccessfulFetch?: string;
			requestId?: string;
		};
		search: {
			status: "idle" | "loading" | "success" | "error";
			error?: string;
			ids: string[];
			nextCursor?: string;
			etag?: string;
			query?: string;
			requestId?: string;
		};
	};
}
