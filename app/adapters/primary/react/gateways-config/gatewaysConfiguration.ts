import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
};

const coffeeGateway = new GoogleApiCoffeeGateway(
    new HttpGoogleApicoffeeLoader(),
);

export const gateways: Gateways = {
    coffeeGateway,
};
