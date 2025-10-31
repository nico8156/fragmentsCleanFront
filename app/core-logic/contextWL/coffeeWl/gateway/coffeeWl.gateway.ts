import {Coffee} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export interface CoffeeWlGateway {
    /** Récupère un café par id. On ne va pas l'utiliser celui-ci pour l'instant */
    get(input: { id: string; ifNoneMatch?: string }): Promise<{ etag?: string; data: Coffee }>;
    /** Récupère tous les café pour ensutie les normaliser. */
    getAllSummaries(input?: { ifNoneMatch?: string }): Promise<{ etag?: string; items: Coffee[] }>;
    /** Recherche (par texte et/ou bounding box). Les deux critères peuvent être combinés. */
    search(input: {
        query?: string;                 // ex: "espresso", "Lomi", ...
        bbox?: { minLat: number; minLon: number; maxLat: number; maxLon: number };
        city?: string;                  // filtre simple
        limit?: number;                 // pagination
        cursor?: string;                // token pagination
    }): Promise<{ items: Coffee[]; nextCursor?: string }>;
}
