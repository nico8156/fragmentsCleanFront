import { logger } from "@/app/core-logic/utils/logger";
import type {
	ProjectionSyncConnectParams,
	ProjectionSyncConnectionState,
	ProjectionSyncGateway,
	ProjectionSyncGatewayStatus,
} from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";
import { SseStreamParser } from "./sseParser";

type FetchLike = (input: string, init?: any) => Promise<{
	ok: boolean;
	status: number;
	body?: {
		getReader: () => {
			read: () => Promise<{ done?: boolean; value?: any }>;
			cancel?: () => Promise<void> | void;
		};
	};
}>;

type Sleep = (ms: number) => Promise<void>;

type HttpProjectionSyncGatewayOptions = {
	baseUrl: string;
	eventsPath?: string;
	fetcher?: FetchLike;
	sleep?: Sleep;
	initialBackoffMs?: number;
	maxBackoffMs?: number;
};

const defaultFetch: FetchLike = (input, init) => fetch(input, init) as any;
const defaultSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const normalizePath = (value: string) => value.startsWith("/") ? value : `/${value}`;

const decodeChunk = (value: any): string => {
	if (typeof value === "string") return value;
	if (typeof TextDecoder !== "undefined") {
		return new TextDecoder().decode(value);
	}
	if (Array.isArray(value)) {
		return String.fromCharCode(...value);
	}
	if (value?.buffer) {
		return String.fromCharCode(...Array.from(new Uint8Array(value.buffer)));
	}
	return String(value ?? "");
};

export class HttpProjectionSyncGateway implements ProjectionSyncGateway {
	private readonly url: string;
	private readonly fetcher: FetchLike;
	private readonly sleep: Sleep;
	private readonly initialBackoffMs: number;
	private readonly maxBackoffMs: number;
	private state: ProjectionSyncConnectionState = "disconnected";
	private lastEventId?: string;
	private stopped = true;
	private abortController?: AbortController;
	private connectSeq = 0;
	private params?: ProjectionSyncConnectParams;

	constructor(options: HttpProjectionSyncGatewayOptions) {
		const baseUrl = stripTrailingSlash(options.baseUrl.trim());
		if (!baseUrl) throw new Error("[ProjectionSync] baseUrl is required");
		this.url = `${baseUrl}${normalizePath(options.eventsPath ?? "/api/sync/events")}`;
		this.fetcher = options.fetcher ?? defaultFetch;
		this.sleep = options.sleep ?? defaultSleep;
		this.initialBackoffMs = options.initialBackoffMs ?? 1000;
		this.maxBackoffMs = options.maxBackoffMs ?? 30000;
	}

	getState(): ProjectionSyncConnectionState {
		return this.state;
	}

	getLastEventId(): string | undefined {
		return this.lastEventId;
	}

	connect(params: ProjectionSyncConnectParams): void {
		if (this.state === "connected" || this.state === "reconnecting") return;

		this.params = params;
		this.stopped = false;
		if (params.lastEventId) this.lastEventId = params.lastEventId;
		const seq = ++this.connectSeq;

		void this.run(seq);
	}

	disconnect(): void {
		this.stopped = true;
		this.connectSeq++;
		this.abortController?.abort();
		this.abortController = undefined;
		this.emitStatus({ state: "disconnected", lastEventId: this.lastEventId });
	}

	private async run(seq: number): Promise<void> {
		let backoffMs = this.initialBackoffMs;

		while (!this.stopped && seq === this.connectSeq) {
			try {
				await this.openStream(seq);
				if (!this.stopped && seq === this.connectSeq) {
					throw new Error("stream closed");
				}
			} catch (error: any) {
				if (this.stopped || seq !== this.connectSeq) return;

				const message = String(error?.message ?? error);
				this.emitStatus({
					state: "reconnecting",
					lastEventId: this.lastEventId,
					error: message,
				});
				logger.info("[ProjectionSync] reconnect scheduled", {
					lastEventId: this.lastEventId,
					backoffMs,
					error: message,
				});
				await this.sleep(backoffMs);
				backoffMs = Math.min(backoffMs * 2, this.maxBackoffMs);
			}
		}
	}

	private async openStream(seq: number): Promise<void> {
		const params = this.params;
		if (!params) return;

		const abortController = new AbortController();
		this.abortController = abortController;

		const headers: Record<string, string> = {
			Accept: "text/event-stream",
		};

		if (params.token) {
			headers.Authorization = `Bearer ${params.token}`;
		}
		if (this.lastEventId) {
			headers["Last-Event-ID"] = this.lastEventId;
		}

		logger.info("[ProjectionSync] connect", {
			url: this.url,
			lastEventId: this.lastEventId,
		});

		const response = await this.fetcher(this.url, {
			method: "GET",
			headers,
			signal: abortController.signal,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		if (!response.body?.getReader) {
			throw new Error("missing SSE body");
		}

		this.emitStatus({ state: "connected", lastEventId: this.lastEventId });

		const parser = new SseStreamParser();
		const reader = response.body.getReader();

		try {
			while (!this.stopped && seq === this.connectSeq) {
				const chunk = await reader.read();
				if (chunk.done) return;

				for (const event of parser.push(decodeChunk(chunk.value))) {
					if (event.id) this.lastEventId = event.id;
					params.onEvent(event);
				}
			}
		} finally {
			await reader.cancel?.();
		}
	}

	private emitStatus(status: ProjectionSyncGatewayStatus) {
		this.state = status.state;
		this.params?.onStatus(status);
	}
}
