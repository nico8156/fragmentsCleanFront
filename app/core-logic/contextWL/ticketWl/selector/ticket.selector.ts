// ticketsSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import {TicketAggregate, TicketsStateWl} from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";
import {RootStateWl} from "@/app/store/reduxStoreWl";


// 1) selectors de base
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
