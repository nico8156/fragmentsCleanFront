import { CoffeeFromOldServer } from "@/assets/data/coffeeFromOldServer";


export interface CoffeeGateway {
    retrieveCoffee(): Promise<CoffeeFromOldServer[]>;
}
