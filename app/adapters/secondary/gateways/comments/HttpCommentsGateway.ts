// HttpCommentsGateway.ts
import type { CommentsWlGateway } from "@/app/core-logic/contextWL/commentWl/gateway/commentWl.gateway";
import type { ListCommentsResult } from "@/app/core-logic/contextWL/commentWl/typeAction/commentWl.type";

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
        cursor?: string | null;
        limit?: number;
        signal: AbortSignal;
        op?: "retrieve" | "refresh" | "older";
    }): Promise<ListCommentsResult> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const qs = new URLSearchParams();
        qs.set("targetId", params.targetId);
        qs.set("op", params.op ?? "retrieve");
        if (params.cursor) qs.set("cursor", params.cursor);
        if (params.limit != null) qs.set("limit", String(params.limit));

        const res = await fetch(`${this.baseUrl}/api/social/comments?${qs.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            signal: params.signal,
        });

        if (!res.ok) {
            throw new Error(`Comments list failed with status ${res.status}`);
        }

        return (await res.json()) as ListCommentsResult;
    }

    async create(input: {
        commandId: string;
        targetId: string;
        parentId?: string | null;
        body: string;
        tempId: string; // commentId côté back (stable) = tempId RN
    }): Promise<void> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const payload = {
            commandId: input.commandId,
            commentId: input.tempId,
            targetId: input.targetId,
            parentId: input.parentId ?? null,
            body: input.body,
            at: new Date().toISOString(),
        };

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

    async update(input: {
        commandId: string;
        commentId: string;
        body: string;
        editedAt?: string;
    }): Promise<void> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const payload = {
            commandId: input.commandId,
            commentId: input.commentId,
            body: input.body,
            editedAt: input.editedAt ?? new Date().toISOString(),
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

    async delete(input: { commandId: string; commentId: string; deletedAt?: string }): Promise<void> {
        const token = await this.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const payload = {
            commandId: input.commandId,
            commentId: input.commentId,
            deletedAt: input.deletedAt ?? new Date().toISOString(),
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
