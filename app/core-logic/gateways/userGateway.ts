export interface UserGateway {
    logUserIn(): Promise<void>;
    logUserOut(): Promise<void>;
    registerUser(): Promise<void>;
}
