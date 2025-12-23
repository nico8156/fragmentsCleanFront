export type CommandStatus = "PENDING" | "APPLIED" | "REJECTED";

export type CommandStatusResult =
    | { status: "PENDING" }
    | { status: "APPLIED"; appliedAt?: string }
    | { status: "REJECTED"; rejectedAt?: string; reason?: string };

export interface CommandStatusGateway {
    getStatus(commandId: string): Promise<CommandStatusResult>;
}
