

export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | [];
    },
    commentRetrieval: {
        data : Comment[] | [];
    },
    likeRetrieval: {
        data : Like[] | [];
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