export interface TicketUploadGateway {
    upload(fileUri: string, onProgress:(pct:number)=>void): Promise<{ remoteId: string }>;
    subscribeValidation(remoteId: string, onResult:(p:{ valid:boolean; data?: any; reason?: string })=>void): () => void;
}