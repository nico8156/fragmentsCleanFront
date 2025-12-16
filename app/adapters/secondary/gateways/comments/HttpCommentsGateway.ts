import type { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import type { ListCommentsResult } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import {computeCommentId} from "@/app/adapters/secondary/gateways/comments/helpers/commentId";

type HttpCommentsGatewayDeps = {
    baseUrl: string;
    getAccessToken: () => Promise<string | null>;
};

export class HttpCommentsGateway implements CommentsWlGateway {
    private readonly baseUrl: string;
    private readonly getAccessToken: () => Promise<string | null>;

    constructor(deps: HttpCommentsGatewayDeps) {
        this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
        this.getAccessToken = deps.getAccessToken;
    }

    async list(params: {
        targetId: string;
        cursor: string;
        limit: number;
        signal: AbortSignal;
        op?: "retrieve" | "refresh" | "older";
    }): Promise<ListCommentsResult> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const qs = new URLSearchParams();
        qs.set("targetId", params.targetId);               // ✅ back attend targetId en query param
        if (params.cursor) qs.set("cursor", params.cursor);
        if (params.limit) qs.set("limit", String(params.limit));
        qs.set("op", params.op ?? "retrieve");             // ✅ back a un param op

        const res = await fetch(
            `${this.baseUrl}/api/social-context/comments?${qs.toString()}`, // ✅ route back
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal: params.signal,
            },
        );

        if (!res.ok) {
            throw new Error(`Comments list failed with status ${res.status}`);
        }

        return (await res.json()) as ListCommentsResult;
    }

    async create({
                     commandId,
                     targetId,
                     parentId,
                     body,
                     tempId,
                 }: {
        commandId: string;
        targetId: string;
        parentId?: string | null;
        body: string;
        tempId?: string;
    }): Promise<void> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        if (!tempId) {
            throw new Error("HttpCommentsGateway.create requires tempId");
        }

        // ❌ SUPPRIMÉ : commandId = computeCommentId(commandId)

        const payload = {
            commandId,          // ✅ inchangé => corrélation outbox OK
            commentId: tempId,
            targetId,
            parentId: parentId ?? null,
            body,
            at: new Date().toISOString(),
        };

        console.log("[HTTP_COMMENTS] create payload", payload);

        const res = await fetch(`${this.baseUrl}/api/social/comments`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok && res.status !== 202 && res.status !== 204) {
            throw new Error(`Comments create failed with status ${res.status}`);
        }
    }

    async update({
                     commandId,
                     commentId,
                     body,
                     editedAt,
                 }: {
        commandId: string;
        commentId: string;
        body: string;
        editedAt?: string;
    }): Promise<void> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        // ✅ ton back attend: commandId, commentId, body, editedAt
        const payload = {
            commandId,
            commentId,
            body,
            editedAt: editedAt ?? new Date().toISOString(),
        };

        const res = await fetch(`${this.baseUrl}/api/social/comments`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok && res.status !== 202 && res.status !== 204) {
            throw new Error(`Comments update failed with status ${res.status}`);
        }
    }

    async delete({
                     commandId,
                     commentId,
                     deletedAt,
                 }: {
        commandId: string;
        commentId: string;
        deletedAt: string;
    }): Promise<void> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        // ✅ ton back attend: commandId, commentId, deletedAt
        const payload = {
            commandId,
            commentId,
            deletedAt,
        };

        const res = await fetch(`${this.baseUrl}/api/social/comments`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok && res.status !== 202 && res.status !== 204) {
            throw new Error(`Comments delete failed with status ${res.status}`);
        }
    }
}
