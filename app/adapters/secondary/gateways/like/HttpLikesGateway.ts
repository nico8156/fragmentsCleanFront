import {computeLikeId} from "@/app/adapters/secondary/gateways/like/helpers/likeId";
import {LikeWlGateway} from "@/app/core-logic/contextWL/likeWl/gateway/likeWl.gateway";
import Constants from "expo-constants";
import {AuthTokenBridge} from "@/app/adapters/secondary/gateways/auth/AuthTokenBridge";

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl as string;

type HttpLikesGatewayDeps = {
    baseUrl: string;                    // ex: "https://api.fragments.app"
    authToken: AuthTokenBridge; // <= au lieu de getAccessToken seul
};

export class HttpLikesGateway implements LikeWlGateway {
    constructor(private readonly deps: HttpLikesGatewayDeps) {}

    async get({ targetId, signal }: { targetId: string; signal: AbortSignal }) {
        console.log("[HTTP_LIKES] get called", { targetId });
        const token = await this.deps.authToken.getAccessToken();
        console.log("[HTTP_LIKES] accessToken =", token ? token.slice(0, 12) + "..." : "<null>");
        if (!token) {
            throw new Error("Not authenticated");
        }
        console.log(`[HTTP_LIKES] get with ${API_BASE_URL} : `, { targetId });
        const res = await fetch(
            `${API_BASE_URL}/api/social/targets/${encodeURIComponent(targetId)}/likes`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal,
            },
        );

        if (!res.ok) {
            throw new Error(`Likes get failed with status ${res.status}`);
        }

        const json = await res.json() as {
            count: number;
            me: boolean;
            version: number;
            serverTime?: string;
        };

        // shape attendu par ton reducer
        return {
            count: json.count,
            me: json.me,
            version: json.version,
            serverTime: json.serverTime,
        };
    }

    async add({ commandId, targetId, at }: { commandId: string; targetId: string; at: string }) {
        const token = await this.deps.authToken.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const userId = this.deps.authToken.getCurrentUserId();
        if (!userId) throw new Error("No userId yet");

        const likeId = computeLikeId(userId, targetId);

        const body = { commandId, likeId, targetId, value: true, at };

        const res = await fetch(`${API_BASE_URL}/api/social/likes`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok && res.status !== 202 && res.status !== 204) {
            throw new Error(`Likes add failed with status ${res.status}`);
        }
    }

    async remove({ commandId, targetId, at }: { commandId: string; targetId: string; at: string }) {
        const token = await this.deps.authToken.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const userId = this.deps.authToken.getCurrentUserId();
        if (!userId) throw new Error("No userId yet");

        const likeId = computeLikeId(userId, targetId);

        const body = { commandId, likeId, targetId, value: false, at };

        const res = await fetch(`${API_BASE_URL}/api/social/likes`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok && res.status !== 202 && res.status !== 204) {
            throw new Error(`Likes remove failed with status ${res.status}`);
        }
    }
}
