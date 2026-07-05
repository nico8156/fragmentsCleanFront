import type { ProjectionSyncConnectionState } from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";

export type ProjectionSyncStateWl = {
	connectionState: ProjectionSyncConnectionState;
	lastEventId?: string;
	lastEventName?: string;
	lastProjection?: string;
	error?: string;
};
