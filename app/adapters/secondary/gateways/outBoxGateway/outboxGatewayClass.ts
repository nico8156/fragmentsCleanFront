import {OutboxItem} from "@/app/core-logic/gateways/outBoxGateway";
import {jobRemoved, jobUpserted, selectSentJobs} from "@/app/core-logic/reducers/exchangesReducer";
import {Store, Deps} from "@/app/core-logic/gateways/outBoxGateway"
import {outboxBumped, outboxEnqueued, outboxFailed, outboxRemoved, outboxReplaced, selectOutbox} from "@/app/contexts/like/reducer/outboxReducer";

export class OutboxGateway {
    private active = false;
    private pollers = new Map<string, AbortController>();

    constructor(private store:Store, private deps:Deps) {}

    enqueue = (cmd: Omit<OutboxItem,'attempts'|'enqueuedAt'>) => {
        const item = { ...cmd, attempts:0, enqueuedAt:this.deps.now() } as OutboxItem;
        if (item.type==='Like.Set') {
            const q = selectOutbox(this.store.getState());
            const next = [...q.filter(c=>!(c.type==='Like.Set' && c.targetId===item.targetId)), item];
            this.store.dispatch(outboxReplaced(next));
        } else {
            this.store.dispatch(outboxEnqueued(item));
        }
    };

    resume = () => {
        if (selectOutbox(this.store.getState()).length) this.processOnce();
        for (const j of selectSentJobs(this.store.getState())) this.startPolling(j.correlationKey, j.jobId);
    };
    suspend = () => { for (const c of this.pollers.values()) c.abort(); this.pollers.clear(); };

    processOnce = async () => {
        if (this.active) return;
        this.active = true;
        try {
            for (const cmd of selectOutbox(this.store.getState())) {
                try { await this.handle(cmd); }
                catch (e) {
                    const retryable = /ECONN|ETIMEDOUT|timeout|5\d\d/.test(String(e));
                    if (retryable) {
                        this.store.dispatch(outboxBumped({ commandId: cmd.commandId, error:String(e)}));
                        const wait = this.deps.backoff ? this.deps.backoff(cmd.attempts) : Math.min(60000, 1000*(2**cmd.attempts)) + Math.floor(Math.random()*300);
                        await this.deps.delay(wait);
                    } else {
                        this.store.dispatch(outboxFailed({ commandId: cmd.commandId, error:String(e)}));
                    }
                }
                await this.deps.delay(0);
            }
        } finally { this.active = false; }
    };

    // --- handlers ---
    private handle = async (cmd:OutboxItem) => {
        switch(cmd.type){
            case 'Like.Set':
                await this.deps.api.likes.set(cmd.targetId, cmd.liked, { commandId: cmd.commandId });
                this.store.dispatch(outboxRemoved({ commandId: cmd.commandId })); return;

            case 'Comment.Create': {
                const r = await this.deps.api.comments.create({ parentId: cmd.parentId, body: cmd.body, clientCommandId: cmd.commandId, tempId: cmd.tempId });
                this.store.dispatch({ type:'comments/commentPosted', payload:{ tempId: cmd.tempId, serverId:r.id, body:r.body } });
                this.store.dispatch(outboxRemoved({ commandId: cmd.commandId })); return;
            }
            case 'Comment.Edit':
                await this.deps.api.comments.edit({ id: cmd.serverId, body: cmd.body, clientCommandId: cmd.commandId });
                this.store.dispatch({ type:'comments/commentEdited', payload:{ serverId: cmd.serverId, body: cmd.body } });
                this.store.dispatch(outboxRemoved({ commandId: cmd.commandId })); return;

            case 'Comment.Delete':
                await this.deps.api.comments.delete({ id: cmd.serverId, clientCommandId: cmd.commandId });
                this.store.dispatch({ type:'comments/commentDeleted', payload:{ serverId: cmd.serverId } });
                this.store.dispatch(outboxRemoved({ commandId: cmd.commandId })); return;

            case 'Ticket.Verify': {
                const { jobId } = await this.deps.verify.verifyById(cmd.draftId);
                this.store.dispatch(jobUpserted({ correlationKey: cmd.draftId, jobId, status:'sent' }));
                this.store.dispatch(outboxRemoved({ commandId: cmd.commandId }));
                this.startPolling(cmd.draftId, jobId);
                return;
            }
        }
    };

    // --- polling ---
    private startPolling(key:string, jobId:string){
        if (this.pollers.has(jobId)) return;
        const ctrl = new AbortController(); this.pollers.set(jobId, ctrl);
        this.pollJob(key, jobId, ctrl.signal).finally(()=>this.pollers.delete(jobId));
    }
    private async pollJob(key:string, jobId:string, signal:AbortSignal){
        const start = this.deps.now(), TIMEOUT=5*60*1000;
        while(true){
            if (signal.aborted) return;
            if (this.deps.now()-start > TIMEOUT){ this.store.dispatch(jobUpserted({ correlationKey:key, jobId, status:'timeout' })); return; }
            const s = await this.deps.verify.getStatus(jobId);
            if (s==='done'){
                const ticket = this.deps.verify.getTicketByDraftId ? await this.deps.verify.getTicketByDraftId(key) : null;
                this.store.dispatch({ type:'tickets/ticketValidated', payload:{ draftId:key, serverTicket: ticket } });
                this.store.dispatch(jobRemoved({ correlationKey:key })); return;
            }
            if (s==='failed'){ this.store.dispatch({ type:'tickets/ticketDraftFailed', payload:{ id:key, reason:'verify_failed' } }); this.store.dispatch(jobUpserted({ correlationKey:key, jobId, status:'failed' })); return; }
            await this.deps.delay(3000 + Math.floor(Math.random()*400));
        }
    }
}
