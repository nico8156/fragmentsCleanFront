import { createSelector } from "@reduxjs/toolkit";
import {TicketAggregate, TicketsStateWl} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";

    export const selectTicketsState = (state: RootStateWl): TicketsStateWl =>
        state.tState;

    export const selectTicketsById = createSelector(
        [selectTicketsState],
        (tState) => tState.byId
    );

    // 2) liste dérivée (mémoïsée)
    export const selectTicketsList = createSelector(
        [selectTicketsById],
        (byId): TicketAggregate[] => Object.values(byId)
    );

    // 3) éventuellement la version triée, si besoin
    export const selectSortedTickets = createSelector(
        [selectTicketsList],
        (tickets): TicketAggregate[] =>
            [...tickets].sort((a, b) => {
                const aDate = a.createdAt ?? a.updatedAt;
                const bDate = b.createdAt ?? b.updatedAt;
                // tu adaptes la logique si besoin
                return (bDate ?? "").localeCompare(aDate ?? "");
            })
    );

    export const selectTicketHistory = createSelector(
        [selectTicketsState, selectSortedTickets],
        (state, fallback): TicketAggregate[] => {
            if (!state.history?.initialized) return fallback;
            const serverIds = new Set(state.history.ids);
            const optimistic = fallback.filter((ticket) => ticket.optimistic && !serverIds.has(ticket.ticketId));
            const server = state.history.ids
                .map((id) => state.byId[id])
                .filter((ticket): ticket is TicketAggregate => Boolean(ticket));
            return [...optimistic, ...server];
        },
    );

    export const selectTicketHistoryRequest = createSelector(
        [selectTicketsState],
        (state) => state.history ?? {
            ids: [], nextCursor: null, status: "idle" as const, error: null, initialized: false,
        },
    );

    export const selectNonTerminalTicketIds = createSelector(
        [selectTicketsList],
        (tickets) => tickets
            .filter((ticket) => ticket.status === "CAPTURED" || ticket.status === "ANALYZING")
            .map((ticket) => ticket.ticketId)
    );
