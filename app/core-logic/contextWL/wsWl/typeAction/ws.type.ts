export type WsStateWl = {
    connected: boolean;
    lastConnectedAt?: string;
    lastDisconnectedAt?: string;
    lastDisconnectInfo?: { code?: number; message?: string };
};
