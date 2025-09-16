import {SecureStoreGateway} from "@/app/core-logic/gateways/secureStoreGateway";
import {SecureStoreHandler} from "@/app/adapters/secondary/gateways/secureStorage/secureStoreHandler";

export class SecureStorageGateway implements SecureStoreGateway{

    constructor(private readonly storageHandler: SecureStoreHandler) {}

    async setItemAsync(key: string, value: string | number): Promise<void> {
        await this.storageHandler.saveSecure(key, value)
        return Promise.resolve()
    }
    async getItemAsync(key: string): Promise<string | null> {
        const item = await this.storageHandler.getSecure(key);
        if (item) {
            return Promise.resolve(item);
        }
        return Promise.resolve(null)
    }
    removeItemAsync(key: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}