import {Coffee} from "@/assets/data/coffee";

export interface CoffeeApiLoader {
    loadCoffee(): Promise<Coffee[]>;
}