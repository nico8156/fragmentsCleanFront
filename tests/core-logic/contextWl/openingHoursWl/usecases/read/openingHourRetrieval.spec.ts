import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeOpeningHoursWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";
import {onOpeningHourRetrieval} from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import {AppStateWl} from "@/app/store/appStateWl";

describe('On OpeningHourRetrieval', () => {
    let store:ReduxStoreWl
    let ohGateaway: FakeOpeningHoursWlGateway

    beforeEach(()=> {
        ohGateaway = new FakeOpeningHoursWlGateway()
        store = initReduxStoreWl({dependencies:{
            gateways:{
                openingHours : ohGateaway
            }
        }})
    })
    afterEach(()=> {
        ohGateaway.willFail = false
    })

    it('should retrieve opening hours', async () => {
        console.log(new Date().getDay())
        await store.dispatch<any>(onOpeningHourRetrieval())
        const state = store.getState() as any
        expect((state.ohState as AppStateWl["openingHours"]).byCoffeeIdDayWindow).toBeDefined()
        expect((state.ohState as AppStateWl["openingHours"]).byCoffeeIdDayWindow["04c848b7-5183-441f-a56e-3cdf3f226271"]).toHaveLength(3)
    })
    it('should, in case of error, hydrate with empty array', async () => {
        ohGateaway.willFail = true
        await store.dispatch<any>(onOpeningHourRetrieval())
        const state = store.getState() as any
        expect((state.ohState as AppStateWl["openingHours"]).byCoffeeId).toEqual({})
    })
});