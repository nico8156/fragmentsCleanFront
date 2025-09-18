import {TicketServerGateway} from "@/app/core-logic/gateways/ticketServerGateway";
import {TicketServerApiHandler} from "@/app/adapters/secondary/gateways/ticket/ticketServerApiHandler";

export class TicketServerApiGateway implements TicketServerGateway{

    constructor(private readonly ticketServerApiHandler: TicketServerApiHandler) {}

    verify({ clientId }: { clientId: string; }): Promise<{ jobId: string; }> {
        const jobId = this.ticketServerApiHandler.verifyRawTextWithServer(clientId);
        return Promise.resolve({jobId:jobId})
    }
}