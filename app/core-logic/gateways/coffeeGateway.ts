import { Coffee } from "@/assets/data/coffee";


export interface CoffeeGateway {
    retrieveCoffee(): Promise<Coffee[]>;
}
