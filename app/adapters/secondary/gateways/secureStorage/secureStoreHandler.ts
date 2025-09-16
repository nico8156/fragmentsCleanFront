export interface SecureStoreHandler {
    saveSecure(key: string, value: string | number): Promise<void>;
    getSecure(key: string): Promise<string | null>;
}