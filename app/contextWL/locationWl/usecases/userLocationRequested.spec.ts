import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeLocationWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeLocationWlGateway";
import {AppStateWl} from "@/app/store/appStateWl";
import { userLocationRequested } from "../typeAction/location.action";
import {FakePhoneLocationProvider} from "@/app/adapters/secondary/gateways/fake/fakePhoneLocationProvider";
import {listenerLocationRequestedFactory} from "@/app/contextWL/locationWl/usecases/userLocationRequested";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe('On userLocationRequested, ', () => {

    let store: ReduxStoreWl;
    let locationGateway: FakeLocationWlGateway;

    beforeEach(() => {
        locationGateway = new FakeLocationWlGateway(
            new FakePhoneLocationProvider()
        )
        store = initReduxStoreWl({
            dependencies:{},
            listeners:    [listenerLocationRequestedFactory({
                gateways: {locations: locationGateway},
                helpers: {},
            })
    ],
        })
    })

    it('should, when happy path update the location state accordingly.', async () => {
        store.dispatch(userLocationRequested())
        await flush()
        expect(store.getState().lcState as AppStateWl["location"]).toEqual({
            lat: 48.117,
            lon: -1.678})

    });
})