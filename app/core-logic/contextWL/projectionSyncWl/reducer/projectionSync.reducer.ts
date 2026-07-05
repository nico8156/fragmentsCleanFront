import { createReducer } from "@reduxjs/toolkit";
import type { ProjectionSyncStateWl } from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.type";
import {
	projectionSyncDisconnected,
	projectionSyncEventReceived,
	projectionSyncStateChanged,
} from "@/app/core-logic/contextWL/projectionSyncWl/typeAction/projectionSync.action";

export const initialProjectionSyncState: ProjectionSyncStateWl = {
	connectionState: "disconnected",
};

export const projectionSyncReducer = createReducer(initialProjectionSyncState, (builder) => {
	builder
		.addCase(projectionSyncStateChanged, (state, action) => {
			state.connectionState = action.payload.state;
			state.lastEventId = action.payload.lastEventId ?? state.lastEventId;
			state.error = action.payload.error;
		})
		.addCase(projectionSyncEventReceived, (state, action) => {
			if (action.payload.event.id) {
				state.lastEventId = action.payload.event.id;
			}
			state.lastEventName = action.payload.event.eventName;
			state.lastProjection = action.payload.event.projection ?? undefined;
		})
		.addCase(projectionSyncDisconnected, (state) => {
			state.connectionState = "disconnected";
		});
});
