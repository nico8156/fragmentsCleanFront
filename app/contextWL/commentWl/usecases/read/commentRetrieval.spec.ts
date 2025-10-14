import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {FakeCommentsWlGateway} from "@/app/adapters/secondary/gateways/fake/fakeCommentsWlGateway";
import {AppStateWl} from "@/app/store/appStateWl";

describe('On comment retrieval : ', () => {
    let store: ReduxStoreWl;
    let commentGateway: FakeCommentsWlGateway;
    beforeEach(() => {
        commentGateway = new FakeCommentsWlGateway();
        store = initReduxStoreWl({
            dependencies: {
                gateways: {
                    comments: commentGateway,
                }
            }
        });
    })
    it('should, before retrieving comment, no comment should be available ', () => {
        expect(store.getState().cState).toEqual<AppStateWl["comments"]>({"byTarget": {}, "entities": {"entities": {}, "ids": []}});
    });
})