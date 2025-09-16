import * as SecureStore from 'expo-secure-store';
import {SecureStoreHandler} from "@/app/adapters/secondary/gateways/secureStorage/secureStoreHandler";

export class SecureStorageDeviceHandler implements SecureStoreHandler{
    async saveSecure(key: string, value: string | number): Promise<void> {
        await SecureStore.setItemAsync(key, value.toString());
        return Promise.resolve()
    }
    async getSecure(key: string): Promise<string | null> {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
            return Promise.resolve(item);
        }
        return Promise.resolve(null)
    }
}