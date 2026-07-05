import type { ProjectionSyncEvent } from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";

type RawSseEvent = {
	id?: string;
	event?: string;
	dataLines: string[];
};

const emptyRaw = (): RawSseEvent => ({ dataLines: [] });

const toProjectionSyncEvent = (raw: RawSseEvent): ProjectionSyncEvent | undefined => {
	if (raw.dataLines.length === 0 && !raw.event) return undefined;

	const data = raw.dataLines.join("\n").trim();
	let parsed: any = {};

	if (data) {
		try {
			parsed = JSON.parse(data);
		} catch {
			parsed = { reason: "invalid-json" };
		}
	}

	const eventName = parsed.eventName ?? raw.event;
	if (!eventName) return undefined;

	return {
		...parsed,
		id: raw.id ?? parsed.id,
		eventName,
		schemaVersion: parsed.schemaVersion ?? 1,
		hints: Array.isArray(parsed.hints) ? parsed.hints : [],
	};
};

export class SseStreamParser {
	private buffer = "";
	private raw = emptyRaw();

	push(chunk: string): ProjectionSyncEvent[] {
		this.buffer += chunk;
		const events: ProjectionSyncEvent[] = [];

		while (true) {
			const match = this.buffer.match(/\r?\n/);
			if (!match || match.index === undefined) break;

			const line = this.buffer.slice(0, match.index).replace(/\r$/, "");
			this.buffer = this.buffer.slice(match.index + match[0].length);

			const event = this.consumeLine(line);
			if (event) events.push(event);
		}

		return events;
	}

	flush(): ProjectionSyncEvent[] {
		if (this.buffer.length === 0) return [];
		const event = this.consumeLine(this.buffer);
		this.buffer = "";
		return event ? [event] : [];
	}

	private consumeLine(line: string): ProjectionSyncEvent | undefined {
		if (line === "") {
			const event = toProjectionSyncEvent(this.raw);
			this.raw = emptyRaw();
			return event;
		}

		if (line.startsWith(":")) return undefined;

		const colonIndex = line.indexOf(":");
		const field = colonIndex >= 0 ? line.slice(0, colonIndex) : line;
		const rawValue = colonIndex >= 0 ? line.slice(colonIndex + 1) : "";
		const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

		if (field === "id") {
			this.raw.id = value;
		} else if (field === "event") {
			this.raw.event = value;
		} else if (field === "data") {
			this.raw.dataLines.push(value);
		}

		return undefined;
	}
}
