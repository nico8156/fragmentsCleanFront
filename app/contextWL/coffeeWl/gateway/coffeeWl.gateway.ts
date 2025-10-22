import {Coffee} from "@/app/contextWL/coffeeWl/typeAction/coffeeWl.type";

export interface CoffeeGateway {
    /** Récupère un café par id. */
    get(input: { id: string; ifNoneMatch?: string }): Promise<{ etag?: string; data: Coffee }>;

    /** Recherche (par texte et/ou bounding box). Les deux critères peuvent être combinés. */
    search(input: {
        query?: string;                 // ex: "espresso", "Lomi", ...
        bbox?: { minLat: number; minLon: number; maxLat: number; maxLon: number };
        city?: string;                  // filtre simple
        limit?: number;                 // pagination
        cursor?: string;                // token pagination
    }): Promise<{ items: Coffee[]; nextCursor?: string }>;
}
