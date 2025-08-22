export interface AppState {
    coffeeRetrieval: {
        data : Coffee[] | null;
    }
}

export interface Coffee {
    id: string;
    name: string;
}