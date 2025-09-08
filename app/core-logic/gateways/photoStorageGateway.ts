export interface PhotoStorageGateway {
    savePhoto(srcUri: string, ticketId: string): Promise<{ fileUri: string; thumbUri: string }>;
    deletePhoto(fileUri: string): Promise<void>;
}