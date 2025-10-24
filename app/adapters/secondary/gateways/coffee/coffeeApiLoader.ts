import {CoffeeFromOldServer} from "@/assets/data/coffeeFromOldServer";

export interface CoffeeApiLoader {
    loadCoffee(): Promise<CoffeeFromOldServer[]>;
}