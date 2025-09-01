export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | null;
    },
    commentRetrieval: {
        data : Comment[] | null;
    },
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