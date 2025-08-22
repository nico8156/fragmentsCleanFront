import {Coffee} from "@/app/store/appState";

export interface CoffeeGateway {
    retrieveCoffee(): Promise<Coffee[]>;
}
