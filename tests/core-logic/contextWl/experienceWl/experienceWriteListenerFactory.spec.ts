import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { experienceReducer } from "@/app/core-logic/contextWL/experienceWl/reducer/experience.reducer";
import { myExperiencesReceived, uiExperienceCreateRequested } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.action";
import { experienceWriteListenerFactory } from "@/app/core-logic/contextWL/experienceWl/usecases/write/experienceWriteListenerFactory";
import { outboxWlReducer } from "@/app/core-logic/contextWL/outboxWl/reducer/outboxWl.reducer";
import { dropCommitted } from "@/app/core-logic/contextWL/outboxWl/typeAction/outbox.actions";

describe("experienceWriteListenerFactory", () => {
	it("turns a ticket-free UI intent into optimistic state and a durable command", async () => {
		let sequence = 0;
		const listener = experienceWriteListenerFactory({ gateways: {}, helpers: {
			nowIso: () => "2026-09-11T10:00:00Z", currentUserId: () => "u1",
			currentUserProfile: () => ({ displayName: "Nicolas" }),
			newCommandId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}` as any,
		} });
		const store = configureStore({ reducer: combineReducers({ exState: experienceReducer, oState: outboxWlReducer }), middleware: getDefault => getDefault({ serializableCheck: false }).prepend(listener.middleware) });
		store.dispatch(uiExperienceCreateRequested({ coffeeId: "c1", message: "  Très belle visite  " }));
		await new Promise(resolve => setTimeout(resolve, 0));
		const state = store.getState(); const experience = Object.values(state.exState.entities.entities)[0]!;
		expect(experience).toMatchObject({ coffeeId: "c1", message: "Très belle visite", status: "PUBLISHED", optimistic: true });
		const record = Object.values(state.oState.byId)[0]!;
		expect(record.item.command).toMatchObject({ kind: "Experience.Create", experienceId: experience.experienceId, coffeeId: "c1" });
		expect(record.item.command).not.toHaveProperty("ticketId");
	});

	it("serializes create, upload and publish when a photo is selected", async () => {
		let sequence = 0;
		const discard = jest.fn();
		const listener = experienceWriteListenerFactory({ gateways: { localPrivateMedia: { discard } }, helpers: {
			nowIso: () => "2026-09-11T10:00:00Z", currentUserId: () => "u1",
			currentUserProfile: () => ({ displayName: "Nicolas" }),
			newCommandId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}` as any,
		} });
		const store = configureStore({ reducer: combineReducers({ exState: experienceReducer, oState: outboxWlReducer }), middleware: getDefault => getDefault({ serializableCheck: false }).prepend(listener.middleware) });
		store.dispatch(uiExperienceCreateRequested({ coffeeId: "c1", message: "Avec photo", photo: { localUri: "file:///private/photo.jpg", contentType: "image/jpeg", size: 1024 } }));
		await new Promise(resolve => setTimeout(resolve, 0));

		const experience = Object.values(store.getState().exState.entities.entities)[0]!;
		const commands = store.getState().oState.queue.map(id => store.getState().oState.byId[id].item.command);
		expect(commands.map(command => command.kind)).toEqual(["Experience.Create", "Experience.Media.Attach", "Experience.Publish"]);
		expect(commands[0]).toMatchObject({ publicationStatus: "DRAFT" });
		expect(commands[1]).toMatchObject({ image: { localUri: "file:///private/photo.jpg" } });

		store.dispatch(dropCommitted({ commandId: commands[1].commandId }));
		store.dispatch(myExperiencesReceived({ items: [{
			...experience,
			version: 1,
			optimistic: false,
			media: [{ mediaId: (commands[1] as any).mediaId, url: "https://cdn.test/photo.jpg", position: 0 }],
		}], nextCursor: null }));
		await new Promise(resolve => setTimeout(resolve, 0));
		expect(discard).toHaveBeenCalledWith("file:///private/photo.jpg");
	});
});
