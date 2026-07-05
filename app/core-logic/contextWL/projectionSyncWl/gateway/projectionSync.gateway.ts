export type ProjectionSyncConnectionState =
	| "connected"
	| "reconnecting"
	| "disconnected"
	| "failed";

export type ProjectionSyncEventName =
	| "sync.connected"
	| "sync.heartbeat"
	| "projection.updated"
	| string;

export type ProjectionSyncEvent = {
	id?: string;
	eventName: ProjectionSyncEventName;
	schemaVersion: number;
	projection?: string | null;
	scope?: string | null;
	entityId?: string | null;
	version?: number | null;
	changedAt?: string | null;
	hints?: string[];
	reason?: string | null;
};

export type ProjectionSyncGatewayStatus = {
	state: ProjectionSyncConnectionState;
	lastEventId?: string;
	error?: string;
};

export type ProjectionSyncConnectParams = {
	token?: string;
	lastEventId?: string;
	onEvent: (event: ProjectionSyncEvent) => void;
	onStatus: (status: ProjectionSyncGatewayStatus) => void;
};

export interface ProjectionSyncGateway {
	connect(params: ProjectionSyncConnectParams): void;
	disconnect(): void;
	getLastEventId?(): string | undefined;
	getState?(): ProjectionSyncConnectionState;
}
