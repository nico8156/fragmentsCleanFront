import {Coffee} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

export type CoffeeCatalogueResult =
	| { kind: "updated"; etag?: string; items: Coffee[]; nextCursor?: string }
	| { kind: "not-modified"; etag?: string };

export type CoffeeDetailResult =
	| { kind: "updated"; etag?: string; data: Coffee }
	| { kind: "not-modified"; etag?: string };

export interface CoffeeWlGateway {
    /** Récupère un café par id. On ne va pas l'utiliser celui-ci pour l'instant */
	get(input: { id: string; ifNoneMatch?: string }): Promise<CoffeeDetailResult>;
    /** Récupère tous les café pour ensutie les normaliser. */
	getAllSummaries(input?: { ifNoneMatch?: string; limit?: number }): Promise<CoffeeCatalogueResult>;
    /** Recherche (par texte et/ou bounding box). Les deux critères peuvent être combinés. */
    search(input: {
        query?: string;                 // ex: "espresso", "Lomi", ...
        limit?: number;                 // pagination
        cursor?: string;                // token pagination
		ifNoneMatch?: string;
	}): Promise<CoffeeCatalogueResult>;
}
