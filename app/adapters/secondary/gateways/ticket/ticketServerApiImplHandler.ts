import {TicketServerApiHandler} from "@/app/adapters/secondary/gateways/ticket/ticketServerApiHandler";

export class TicketServerApiImplHandler implements TicketServerApiHandler{
    verifyRawTextWithServer(rawText: string): string {
        return "jobId007";
    }
}