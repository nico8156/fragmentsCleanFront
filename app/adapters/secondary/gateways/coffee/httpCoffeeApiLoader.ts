import {CoffeeApiLoader} from "@/app/adapters/secondary/gateways/coffee/coffeeApiLoader";
import {Coffee, coffeeData} from "@/assets/data/coffee";

export class HttpCoffeeApiLoader implements CoffeeApiLoader {
    loadCoffee(): Promise<Coffee[]> {
        return Promise.resolve(coffeeData);
    }

}