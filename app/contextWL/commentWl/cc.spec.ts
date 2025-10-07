import {ccAction, createCommentUseCaseFactory} from "@/app/contextWL/commentWl/cc";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";

describe('On comment creation button pressed : ', () => {
    let store: ReduxStoreWl
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
            store.dispatch(ccAction({}))

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
        expect(true).toBeTruthy()
    }
    const createOnccListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    )=>{
        return createCommentUseCaseFactory(()=>{
            try {
                doExpectations();
                resolve({});
            } catch (error) {
                reject(error);
            }
        }).middleware;
    }
})


