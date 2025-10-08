import {CommentsStateWl} from "@/app/contextWL/commentWl/commentWl.type";
import {OutboxStateWl} from "@/app/contextWL/outboxWl/outbox.type";

export interface AppStateWl {
    comments:CommentsStateWl;
    outbox:OutboxStateWl
}

export interface DependenciesWl {
    gateways: any;
    helpers: {
        nowIso: () => string;
        currentUserId: () => string;
        getCommentIdForTests: () => string;
        getCommandIdForTests: () => string;
    }

}

