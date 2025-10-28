export interface ohStateWl {
    byCoffeeId: Record<string, string[]>
}

export type OpeningHours = {
    id: string,
    coffee_id: string,
    weekday_description: string,
}