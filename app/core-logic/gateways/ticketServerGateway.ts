export interface TicketServerGateway {
    verify({clientId}: {clientId: string}): Promise<{jobId: string}>;
}