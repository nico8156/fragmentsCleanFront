// services/persistence.mmkvStorage.ts

import { MMKVLoader } from 'react-native-mmkv-storage';
import {KeyValueStore} from "@/app/adapters/secondary/gateways/outBoxGateway/keyValueStore";

const storage = new MMKVLoader().initialize();

// Clés de stockage
const OUTBOX_KEY = 'exchanges/outbox';
const JOBS_KEY  = 'exchanges/jobs';

export class MMKVStorageStore implements KeyValueStore {
    async getItem(key: string): Promise<string | null> {
        try {
            const val = await storage.getStringAsync(key);
            return val !== undefined ? val : null;
        } catch (e) {
            console.error('MMKVStorage getItem error', key, e);
            return null;
        }
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            await storage.setItem(key, value);
        } catch (e) {
            console.error('MMKVStorage setItem error', key, e);
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            storage.removeItem(key);
        } catch (e) {
            console.error('MMKVStorage removeItem error', key, e);
        }
    }
}
