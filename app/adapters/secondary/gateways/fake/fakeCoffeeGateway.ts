import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {Coffee} from "@/assets/data/coffee";


export class FakeCoffeeGateway implements CoffeeGateway {
    nextCoffees: Coffee[] | null = null;

    async retrieveCoffee(): Promise<Coffee[]> {
        return this.nextCoffees!;
    }
}

