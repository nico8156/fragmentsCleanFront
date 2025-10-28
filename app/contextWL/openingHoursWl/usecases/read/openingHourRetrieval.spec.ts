import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeOpeningHoursWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeOpeningHoursWlGateway";
import {onOpeningHourRetrieval} from "@/app/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
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
        await store.dispatch<any>(onOpeningHourRetrieval())
        const state = store.getState() as any
        expect((state.ohState as AppStateWl["openingHours"]).byCoffeeId).toBeDefined()
        expect((state.ohState as AppStateWl["openingHours"]).byCoffeeId["15626614-f66d-4a41-b119-e27c9f963ab1"]).toHaveLength(7)
    })
    it('should, in case of error, hydrate with empty array', async () => {
        ohGateaway.willFail = true
        await store.dispatch<any>(onOpeningHourRetrieval())
        const state = store.getState() as any
        expect((state.ohState as AppStateWl["openingHours"]).byCoffeeId).toEqual({})
    })
});