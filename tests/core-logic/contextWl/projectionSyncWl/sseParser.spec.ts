import { SseStreamParser } from "@/app/adapters/secondary/gateways/projectionSync/sseParser";

describe("SseStreamParser", () => {
	it("parses id, event name and JSON data across chunks", () => {
		const parser = new SseStreamParser();

		expect(parser.push('id: 42\nevent: projection.updated\ndata: {"eventName":"projection.updated",')).toEqual([]);
		const events = parser.push('"schemaVersion":1,"projection":"comments","scope":"target","entityId":"target-1","hints":["created"]}\n\n');

		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			id: "42",
			eventName: "projection.updated",
			schemaVersion: 1,
			projection: "comments",
			scope: "target",
			entityId: "target-1",
			hints: ["created"],
		});
	});

	it("parses heartbeat and ignores comment lines", () => {
		const parser = new SseStreamParser();

		const events = parser.push(': keepalive\nid: 10\nevent: sync.heartbeat\ndata: {"eventName":"sync.heartbeat","schemaVersion":1}\n\n');

		expect(events).toEqual([
			expect.objectContaining({
				id: "10",
				eventName: "sync.heartbeat",
			}),
		]);
	});
});
