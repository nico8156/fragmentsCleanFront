import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CoffeeFromOldServer} from "@/assets/data/coffeeFromOldServer";


export class FakeCoffeeGateway implements CoffeeGateway {
    nextCoffees: CoffeeFromOldServer[] | null = null;

    async retrieveCoffee(): Promise<CoffeeFromOldServer[]> {
        return this.nextCoffees!;
    }
}

