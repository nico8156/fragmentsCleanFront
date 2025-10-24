import {CoffeeApiLoader} from "@/app/adapters/secondary/gateways/coffee/coffeeApiLoader";
import {CoffeeFromOldServer, coffeeData} from "@/assets/data/coffeeFromOldServer";

export class HttpCoffeeApiLoader implements CoffeeApiLoader {
    loadCoffee(): Promise<CoffeeFromOldServer[]> {
        return Promise.resolve(coffeeData);
    }

}