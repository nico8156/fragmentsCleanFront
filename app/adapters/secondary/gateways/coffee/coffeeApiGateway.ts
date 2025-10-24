import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";

import {CoffeeApiLoader} from "@/app/adapters/secondary/gateways/coffee/coffeeApiLoader";
import {CoffeeFromOldServer} from "@/assets/data/coffeeFromOldServer";

export class CoffeeApiGateway implements CoffeeGateway {

    constructor(private readonly coffeeLoader: CoffeeApiLoader) {}

    async retrieveCoffee(): Promise<CoffeeFromOldServer[]> {
        const apiResponse = await this.coffeeLoader.loadCoffee();
        if (!apiResponse) {
            return []as CoffeeFromOldServer[];
        }
        return apiResponse;
    }
}