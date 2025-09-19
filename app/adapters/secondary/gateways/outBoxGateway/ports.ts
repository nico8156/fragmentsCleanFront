// boot/outboxPorts.ts
import type { UUID } from '@/app/store/appState';
import type { LikeGateway } from '@/app/core-logic/gateways/likeGateway';
import type { CommentGateway } from '@/app/core-logic/gateways/commentGateway';
import type { TicketServerGateway } from '@/app/core-logic/gateways/ticketServerGateway';

export const makeApiPorts = (like: LikeGateway, comment: CommentGateway) => ({
    likes:   { set: (targetId: string, liked: boolean, { commandId }: { commandId: UUID }) =>
            like.set({ targetId, liked, commandId }) },
    comments:{ create: (a:{ parentId:string; body:string; clientCommandId:UUID; tempId:string }) => comment.create(a),
        edit:   (a:{ id:string; body:string; clientCommandId:UUID }) => comment.edit(a),
        delete: (a:{ id:string; clientCommandId:UUID }) => comment.delete(a) },
});

export const makeVerifyPort = (ticket: TicketServerGateway) => ({
    verifyById: (draftId: string) => ticket.verifyById(draftId),
    getStatus:  (jobId: string)   => ticket.getStatus(jobId),
    getTicketByDraftId: (draftId: string) =>
        ticket.getTicketByDraftId ? ticket.getTicketByDraftId(draftId) : Promise.resolve(null),
});
