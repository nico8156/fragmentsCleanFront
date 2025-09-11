export interface oAuthServerGateway {
    initOAuth(url: string): Promise<any>;
}

