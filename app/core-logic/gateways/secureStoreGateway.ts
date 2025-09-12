export interface SecureStoreGateway {
    setItemAsync(key: string, value: string): Promise<void>;
    getItemAsync(key: string): Promise<string | null>;
}