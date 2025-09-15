import {SecureStoreGateway} from "@/app/core-logic/gateways/secureStoreGateway";

export class FakeSecureStoreGateway implements SecureStoreGateway {

    public storage: Record<string, string | number> = {};
    public willFailStorageGet: boolean = false;
    public willFailStorageSet: boolean = false;

    setItemAsync(key: string, value: string|number): Promise<void> {
        if (this.willFailStorageSet) {
            throw new Error("Failed to set item");
        }
        this.storage[key] = value;
        return Promise.resolve();
    }
    getItemAsync(key: string): Promise<string |number| null> {
        if (this.willFailStorageGet) {
            throw new Error("Failed to get item");
        }
        return Promise.resolve(this.storage[key] ?? null);
    }
    removeItemAsync(key: string): Promise<void> {
        delete this.storage[key];
        return Promise.resolve();
    }

}