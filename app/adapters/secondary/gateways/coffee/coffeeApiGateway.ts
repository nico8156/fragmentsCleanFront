import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";

import {CoffeeApiLoader} from "@/app/adapters/secondary/gateways/coffee/coffeeApiLoader";
import {Coffee} from "@/assets/data/coffee";

export class CoffeeApiGateway implements CoffeeGateway {

    constructor(private readonly coffeeLoader: CoffeeApiLoader) {}

    async retrieveCoffee(): Promise<Coffee[]> {
        const apiResponse = await this.coffeeLoader.loadCoffee();
        if (!apiResponse) {
            return []as Coffee[];
        }
        return apiResponse;
    }
}