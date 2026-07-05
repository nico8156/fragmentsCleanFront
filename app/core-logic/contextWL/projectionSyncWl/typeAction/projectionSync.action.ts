import { createAction } from "@reduxjs/toolkit";
import type {
	ProjectionSyncEvent,
	ProjectionSyncGatewayStatus,
} from "@/app/core-logic/contextWL/projectionSyncWl/gateway/projectionSync.gateway";

export const projectionSyncEnsureConnectedRequested = createAction(
	"projectionSync/ensureConnectedRequested",
);

export const projectionSyncDisconnectRequested = createAction(
	"projectionSync/disconnectRequested",
);

export const projectionSyncStateChanged = createAction<ProjectionSyncGatewayStatus>(
	"projectionSync/projectionSyncStateChanged",
);

export const projectionSyncEventReceived = createAction<{ event: ProjectionSyncEvent }>(
	"projectionSync/projectionSyncEventReceived",
);

export const projectionSyncDisconnected = createAction(
	"projectionSync/projectionSyncDisconnected",
);
