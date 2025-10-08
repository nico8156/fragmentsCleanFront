import {ccAction, createCommentUseCaseFactory} from "@/app/contextWL/commentWl/cc";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {DependenciesWl} from "@/app/store/appStateWl";

describe('On comment creation button pressed : ', () => {
    let store: ReduxStoreWl
    let dependencies: DependenciesWl
    //let commentGateway: FakeCommentGateway

    beforeEach(() => {
        //commentGateway = new FakeCommentGateway()
    })

    it('should add optimistic comment and new command', () => {
        return new Promise((resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualCommentAndOutbox(),
                resolve,
                reject,
            );
            store.dispatch(ccAction({
                targetId:"un id de cafe",
                body:"un commentaire",
            }))

        })
    })
    function createReduxStoreWithListener(
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: () => void,
    ) {
        return initReduxStoreWl({
            dependencies:{
            },
            listeners:[
                createOnccListener(doExpectations, resolve, reject),
            ]
        })
    }
    function expectActualCommentAndOutbox() {
        expect(store.getState().cState.byTarget["cmt_tmp_Yffc7N3rOvXUYWMCLZnGT"]).not.toBeNull();
        expect(store.getState().cState.entities.entities["cmt_tmp_Yffc7N3rOvXUYWMCLZnGT"]).not.toBeNull();
        expect(store.getState().cState.entities.entities["cmt_tmp_Yffc7N3rOvXUYWMCLZnGT"].body).toEqual("un commentaire");
        expect(store.getState().cState.entities.entities["cmt_tmp_Yffc7N3rOvXUYWMCLZnGT"].optimistic).toEqual(true);
        expect(store.getState().cState.entities.entities["cmt_tmp_Yffc7N3rOvXUYWMCLZnGT"].targetId).toEqual("un id de cafe");
        expect(store.getState().oState.byCommandId["cmt_tmp_Yffc7N3rOvXUYWMCLZnGT"]).not.toBeNull();
        expect(store.getState().oState.byId["obc_tmp_Yffc7N3rOvXUYWMCLZnGT"]).not.toBeNull();
        expect(store.getState().oState.byId["obc_tmp_Yffc7N3rOvXUYWMCLZnGT"].item.command.body).toEqual("un commentaire");
        expect(store.getState().oState.queue.length).toEqual(1);
        //expect an action to have been called:
    }
    const createOnccListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    )=>{
        return createCommentUseCaseFactory({
            gateways: {},
            helpers: {
                nowIso: () => new Date().toISOString(),
                currentUserId: () => "testUser",
                getCommentIdForTests: () => "cmt_tmp_Yffc7N3rOvXUYWMCLZnGT",
                getCommandIdForTests: () => "obc_tmp_Yffc7N3rOvXUYWMCLZnGT"
            }
        }, () => {
            try {
                doExpectations();
                resolve({});
            } catch (error) {
                reject(error);
            }
        }).middleware;
    }
})


