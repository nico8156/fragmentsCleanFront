import { TicketsWlGateway } from "@/app/core-logic/contextWL/ticketWl/gateway/ticketWl.gateway";
import { CommandId, ISODate, TicketId } from "@/app/core-logic/contextWL/ticketWl/typeAction/ticket.type";

type VerifyInput = {
    commandId: CommandId;
    ticketId: string | undefined;
    imageRef: string | undefined;
    ocrText: string | null;
    at: ISODate;
};

export class FakeTicketsGateway implements TicketsWlGateway {
    public readonly verifyCalls: VerifyInput[] = [];
    public shouldFail = false;

    async verify(input: VerifyInput): Promise<void> {
        this.verifyCalls.push(input);

        if (this.shouldFail) {
            throw new Error("FakeTicketsGateway.verify failed");
        }
    }
}
