import { UUID } from "@/app/store/appState";

export interface OutBoxGateway {
    /** Enfile une commande, complète les champs (commandId, enqueuedAt, attempts) et persiste */
    enqueue(partial: Omit<OutboxItem, 'commandId'|'enqueuedAt'|'attempts'>): void;
    /** Dépile et traite séquentiellement l'outbox une fois (à appeler au foreground/reconnexion) */
    processOnce(): Promise<void>;
    /** Stop timers/polling */
    suspend(): void;
    /** Relance timers/polling si nécessaire */
    resume(): void;
}

export type OutboxItem =
    | { type:'Like.Set'; commandId:UUID; targetId:string; liked:boolean; attempts:number; enqueuedAt:number }
    | { type:'Comment.Create'; commandId:UUID; parentId:string; body:string; tempId:string; attempts:number; enqueuedAt:number }
    | { type:'Comment.Edit'; commandId:UUID; serverId:string; body:string; attempts:number; enqueuedAt:number }
    | { type:'Comment.Delete'; commandId:UUID; serverId:string; attempts:number; enqueuedAt:number }
    | { type:'Ticket.Verify'; commandId:UUID; draftId:string; attempts:number; enqueuedAt:number };

export type JobStatus = 'queued'|'sent'|'pending'|'done'|'failed';

export interface JobEntry {
    correlationKey: string;
    jobId: string;
    status: JobStatus;
}

export type VerifyGateway = {
    verifyById(draftId:string):Promise<{jobId:string}>;
    getStatus(jobId:string):Promise<'pending'|'done'|'failed'>;
    getTicketByDraftId?: (draftId:string)=>Promise<any|null>;
};

export type ApiPort = {
    likes:{ set(tid:string, liked:boolean, meta:{commandId:UUID}):Promise<void> };
    comments:{
        create(a:{parentId:string; body:string; clientCommandId:UUID; tempId:string}):Promise<{id:string; body:string}>;
        edit(a:{id:string; body:string; clientCommandId:UUID}):Promise<void>;
        delete(a:{id:string; clientCommandId:UUID}):Promise<void>;
    };
};

export type Deps = { now:()=>number; delay:(ms:number)=>Promise<void>; api:ApiPort; verify:VerifyGateway; backoff?:(n:number)=>number };

export type Store = { dispatch:(a:any)=>void; getState:()=>any };