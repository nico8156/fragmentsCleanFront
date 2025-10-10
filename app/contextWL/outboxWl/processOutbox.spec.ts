import { enqueueCommited, outboxProcessOnce} from "@/app/contextWL/commentWl/cc";
import {initReduxStoreWl, ReduxStoreWl} from "@/app/store/reduxStoreWl";
import {DependenciesWl} from "@/app/store/appStateWl";
import {processOutboxFactory} from "@/app/contextWL/outboxWl/processOutbox";
import {commandKinds} from "@/app/contextWL/outboxWl/outbox.type";
import {CommentGatewayWl} from "@/app/core-logic/gateways/commentGatewayWl";
import {FakeCommentGatewayWl} from "@/app/adapters/secondary/gateways/fake/fakeCommentGatewayWl";

describe('On outboxProcessOnce triggered : ', () => {
    let store: ReduxStoreWl
    let dependencies: DependenciesWl
    let commentGateway: CommentGatewayWl

    beforeEach(() => {
        commentGateway = new FakeCommentGatewayWl()
        jest.useFakeTimers();
    })

    it('should, when happy path, mark status to awaitingAck and enqueue',() => {

        return new Promise(async (resolve, reject) => {
            store = createReduxStoreWithListener(
                () => expectActualOutbox(),
                resolve,
                reject,
            );
            store.dispatch(enqueueCommited(outboxRecord))
            expect(store.getState().oState.queue.length).toEqual(1);
            store.dispatch(outboxProcessOnce())
            jest.runAllTimers()

        })
    })

    const flush = () => new Promise<void>(r => setTimeout(r, 0));

    function expectActualOutbox() {
        expect(store.getState().oState.queue.length).toEqual(0);
        expect(store.getState().oState.byId["obx_0001"].status).toEqual("awaitingAck")
    }
    function createReduxStoreWithListener(
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: () => void,
    ) {
        return initReduxStoreWl({
            dependencies:{

            },
            listeners:[
                createOnprocessOutboxUseCaseListener(doExpectations, resolve, reject),
            ]
        })
    }
    const createOnprocessOutboxUseCaseListener = (
        doExpectations: () => void,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    )=>{
        return processOutboxFactory({
            gateways: {
                comments: commentGateway,
            },
            helpers: {
                nowIso: () => new Date().toISOString(),
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
    const outboxRecord = {
        id: "obx_0001",
        item: {
            command: {
                kind: commandKinds.CommentCreate,
                commandId: "cmd_aaa111",
                tempId: "cmt_tmp_aaa111",
                targetId: "cafe_fragments_rennes",
                body: "Excellent flat white, ambiance au top.",
                createdAt: "2025-10-10T07:00:00.000Z",
            },
            undo: {
                kind: commandKinds.CommentCreate,
                tempId: "cmt_tmp_aaa111",
                targetId: "cafe_fragments_rennes",
            },
        },
        enqueuedAt: "2025-10-10T07:00:01.000Z",
    }
})