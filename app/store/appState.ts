
export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | [];
    },
    commentRetrieval: {
        data : Comment[] | [];
    },
    likeRetrieval: {
        data : Like[] | [];
    },
    authState: {
        authData: AuthState;
    }
    // commentCreationValidation: {
    //     data : boolean;
    //     error: "EMPTY_CONTENT_NOT_ALLOWED" | null;
    // }
}

export interface Coffee {
    id: string;
    name: string;
}

export interface Comment {
    id: string;
    text: string;
}
export interface Like {
    id: string;
    userId: string;
    coffeeId: string;
}

export type AuthStatus = "anonymous" | "authenticating" | "authenticated" | "error";

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // epoch ms
}

export interface AuthState {
    status: AuthStatus;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    error: string | null; // "PROVIDER_ERROR" | "TOKEN_EXPIRED" | ...
}
