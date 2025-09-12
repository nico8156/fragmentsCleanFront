import {SecureStoreGateway} from "@/app/core-logic/gateways/secureStoreGateway";

export class FakeSecureStoreGateway implements SecureStoreGateway {
    public storage: Record<string, string> = {};

    setItemAsync(key: string, value: string): Promise<void> {
        this.storage[key] = value;
        return Promise.resolve();
    }
    getItemAsync(key: string): Promise<string | null> {
        return Promise.resolve(this.storage[key] ?? null);
    }

}