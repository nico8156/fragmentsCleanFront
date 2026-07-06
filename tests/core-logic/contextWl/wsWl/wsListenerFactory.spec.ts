import { initReduxStoreWl } from "@/app/store/reduxStoreWl";
import type {
	WsClientState,
	WsConnectParams,
	WsEventsGatewayPort,
} from "@/app/core-logic/contextWL/wsWl/gateway/wsWl.gateway";
import { wsEnsureConnectedRequested } from "@/app/core-logic/contextWL/wsWl/typeAction/ws.action";
import { wsListenerFactory } from "@/app/core-logic/contextWL/wsWl/usecases/wsListenerFactory";
import type { WsInboundEvent } from "@/app/adapters/primary/socket/ws.type";

class FakeWsGateway implements WsEventsGatewayPort {
	params?: WsConnectParams;
	state: WsClientState = "DISCONNECTED";
	connectCalls = 0;

	connect(params: WsConnectParams): void {
		this.connectCalls++;
		this.params = params;
		this.state = "CONNECTED";
		params.onConnected?.();
	}

	async disconnect(): Promise<void> {
		this.state = "DISCONNECTED";
	}

	isConnected(): boolean {
		return this.state === "CONNECTED";
	}

	getState(): WsClientState {
		return this.state;
	}

	emit(event: WsInboundEvent) {
		this.params?.onEvent(event);
	}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("wsListenerFactory", () => {
	it("ignores legacy like ACKs because likes freshness is owned by projectionSync", async () => {
		const ws = new FakeWsGateway();
		const store = initReduxStoreWl({
			dependencies: {
				gateways: {
					ws,
				} as any,
			},
			listeners: [
				wsListenerFactory({
					gateways: {
						ws,
					} as any,
					wsUrl: "http://localhost/ws",
					sessionRef: {
						current: {
							tokens: {
								accessToken: "mobile-token",
							},
						} as any,
					},
				}),
			],
		});

		store.dispatch(wsEnsureConnectedRequested());
		await flush();

		expect(ws.connectCalls).toBe(1);

		ws.emit({
			type: "social.like.added_ack",
			commandId: "cmd-like-1",
			targetId: "target-1",
			count: 10,
			me: true,
			version: 2,
			updatedAt: "2026-07-06T10:00:00.000Z",
		});
		await flush();

		expect((store.getState() as any).lState.byTarget["target-1"]).toBeUndefined();
	});
});
