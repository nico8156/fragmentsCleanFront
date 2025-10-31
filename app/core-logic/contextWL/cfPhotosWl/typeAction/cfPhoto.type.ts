export interface CfPhotoStateWl {
    byCoffeeId : Record<string, string[]>
}

export type PhotoURI = {
    id: string,
    coffee_id: string,
    photo_uri: string,
}