import { HttpProjectionSyncGateway } from "@/app/adapters/secondary/gateways/projectionSync/HttpProjectionSyncGateway";

const responseWithChunks = (chunks: string[]) => {
	let index = 0;
	return {
		ok: true,
		status: 200,
		body: {
			getReader: () => ({
				read: jest.fn(async () => {
					if (index < chunks.length) {
						return { done: false, value: chunks[index++] };
					}
					return { done: true };
				}),
				cancel: jest.fn(),
			}),
		},
	};
};

const responseThatStaysOpen = (chunk: string) => {
	let sent = false;
	return {
		ok: true,
		status: 200,
		body: {
			getReader: () => ({
				read: jest.fn(async () => {
					if (!sent) {
						sent = true;
						return { done: false, value: chunk };
					}
					return new Promise(() => undefined);
				}),
				cancel: jest.fn(),
			}),
		},
	};
};

describe("HttpProjectionSyncGateway", () => {
	it("resets Last-Event-ID for a new connection and ignores a late chunk from the old stream", async () => {
		let releaseOld!: (chunk: any) => void;
		const oldRead = new Promise(resolve => { releaseOld = resolve; });
		const fetcher = jest.fn()
			.mockResolvedValueOnce({ ok: true, status: 200, body: { getReader: () => ({ read: () => oldRead, cancel: async () => undefined }) } })
			.mockResolvedValueOnce(responseThatStaysOpen('id: B-event\nevent: sync.heartbeat\ndata: {"eventName":"sync.heartbeat","schemaVersion":1}\n\n'));
		const gateway = new HttpProjectionSyncGateway({ baseUrl: "https://example.test", fetcher: fetcher as any });
		const oldEvents = jest.fn();
		gateway.connect({ token: "A", lastEventId: "A-cursor", onStatus: jest.fn(), onEvent: oldEvents });
		await new Promise(resolve => setTimeout(resolve, 0));
		gateway.disconnect();
		gateway.connect({ token: "B", onStatus: jest.fn(), onEvent: jest.fn() });
		await new Promise(resolve => setTimeout(resolve, 0));
		releaseOld({ done: false, value: 'id: late-A\nevent: sync.heartbeat\ndata: {"eventName":"sync.heartbeat","schemaVersion":1}\n\n' });
		await new Promise(resolve => setTimeout(resolve, 0));
		expect(fetcher.mock.calls[1][1].headers["Last-Event-ID"]).toBeUndefined();
		expect(gateway.getLastEventId()).toBe("B-event");
		expect(oldEvents).not.toHaveBeenCalled();
		gateway.disconnect();
	});
	it("stops reconnecting after an auth rejection", async () => {
		const fetcher = jest.fn(async () => ({
			ok: false,
			status: 401,
		})) as any;
		const sleep = jest.fn(async () => undefined);
		const statuses: any[] = [];
		const gateway = new HttpProjectionSyncGateway({
			baseUrl: "https://example.test",
			fetcher,
			sleep,
			initialBackoffMs: 1,
		});

		gateway.connect({
			token: "expired-token",
			onStatus: (status) => statuses.push(status),
			onEvent: jest.fn(),
		});

		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(sleep).not.toHaveBeenCalled();
		expect(statuses).toContainEqual({ state: "failed", error: "HTTP 401" });
	});

	it("reconnects with Last-Event-ID after stream interruption", async () => {
		const calls: any[] = [];
		const fetcher = jest.fn(async (_url: string, init: any) => {
			calls.push(init);
			if (calls.length === 1) {
				return responseWithChunks([
					'id: 5\nevent: sync.heartbeat\ndata: {"eventName":"sync.heartbeat","schemaVersion":1}\n\n',
				]);
			}
			return responseThatStaysOpen(
				'id: 6\nevent: projection.updated\ndata: {"eventName":"projection.updated","schemaVersion":1,"projection":"comments","scope":"target","entityId":"target-1","hints":["created"]}\n\n',
			);
		}) as any;
		const statuses: any[] = [];
		const events: any[] = [];
		const gateway = new HttpProjectionSyncGateway({
			baseUrl: "https://example.test",
			fetcher,
			sleep: jest.fn(async () => undefined),
			initialBackoffMs: 1,
		});

		gateway.connect({
			token: "secret-token",
			onStatus: (status) => statuses.push(status),
			onEvent: (event) => {
				events.push(event);
				if (event.id === "6") gateway.disconnect();
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 0));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(fetcher).toHaveBeenCalledTimes(2);
		expect(calls[0].headers.Authorization).toBe("Bearer secret-token");
		expect(calls[1].headers["Last-Event-ID"]).toBe("5");
		expect(events.map((event) => event.eventName)).toEqual(["sync.heartbeat", "projection.updated"]);
		expect(statuses.some((status) => status.state === "reconnecting")).toBe(true);
	});
});
