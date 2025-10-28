// Types "brandés" (facultatif)
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
    googleId:string;
    name: string;
    location: GeoPoint;
    address: Address;
    phoneNumber:string;
    website?:string;
    rating?: number;     // optionnel (avg)
    tags?: string[];     // ex: ["espresso", "filter", "roaster"]
    version: number;     // version serveur
    updatedAt: ISODate;  // maj côté serveur
}

// Slice state
export interface CoffeeStateWl {
    byId: Record<string, Coffee>;
    ids: string[]; // ordre global par défaut
    // (optionnel) indexes simples
    byCity?: Record<string, string[]>; // city -> [ids]
}
