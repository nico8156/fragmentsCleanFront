export interface SecureStoreGateway {
    setItemAsync(key: string, value: string|number): Promise<void>;
    getItemAsync(key: string): Promise<string| number | null>;
    removeItemAsync(key: string): Promise<void>;
}