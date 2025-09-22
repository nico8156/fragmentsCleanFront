import {initReduxStore, ReduxStore} from "@/app/store/reduxStore";
import {AppState} from "@/app/store/appState";
import {FakeCoffeeGateway} from "@/app/adapters/secondary/gateways/fake/fakeCoffeeGateway";
import {retrieveCoffee} from "@/app/core-logic/use-cases/coffee/retrieveCoffee";
import {Coffee} from "@/assets/data/coffee";

describe('coffee retrieval', () => {
    let store: ReduxStore;
    let coffeeGateway: FakeCoffeeGateway;

    beforeEach(() => {
        coffeeGateway = new FakeCoffeeGateway();
        store = initReduxStore({gateways: {coffeeGateway}});
    });
    it("before retrieving coffee, no coffee should be available", () => {
        expect(store.getState().coffeeRetrieval).toEqual<
            AppState["coffeeRetrieval"]
        >({data: []});
    });

    it("should retrieve all coffee", async () => {
        coffeeGateway.nextCoffees = aCoffees;
        await store.dispatch(retrieveCoffee());
        expect(store.getState().coffeeRetrieval).toEqual<
            AppState["coffeeRetrieval"]
        >({data: aCoffees});
    });

    const aCoffees: Coffee[] = [
        {
            "id": "07dae867-1273-4d0f-b1dd-f206b290626b",
            "google_id": "ChIJB8tVJh3eDkgRrbxiSh2Jj3c",
            "display_name": "Columbus Café & Co",
            "formatted_address": "Centre Commercial Grand Quartier, 35760 Saint-Grégoire, France",
            "national_phone_number": "02 99 54 25 82",
            "website_uri": "https://www.columbuscafe.com/boutique/saint-gregoire-centre-commercial-grand-quartier/",
            "latitude": 48.1368282,
            "longitude": -1.6953883
        },

    ];
})