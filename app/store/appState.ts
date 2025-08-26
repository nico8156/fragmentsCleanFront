export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | null;
    },
    commentRetrieval: {
        data : Comment[] | null;
    }
}

export interface Coffee {
    id: string;
    name: string;
}

export interface Comment {
    id: string;
    text: string;
}