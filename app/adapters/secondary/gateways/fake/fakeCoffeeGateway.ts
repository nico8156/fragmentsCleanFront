import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {Coffee} from "@/app/store/appState";

export class FakeCoffeeGateway implements CoffeeGateway {
    nextCoffees: Coffee[] | null = null;

    async retrieveCoffee(): Promise<Coffee[]> {
        return this.nextCoffees!;
    }
}

