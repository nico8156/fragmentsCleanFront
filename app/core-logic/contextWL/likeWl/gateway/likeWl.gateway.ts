//PORT === LIKE
export interface LikeWlGateway{
    get({ targetId, signal}:{ targetId:string, signal:AbortSignal}):Promise<{ count: number; me: boolean; version: number; serverTime?: string}>
    add({commandId, targetId, userId, at}:{commandId: string, targetId: string, userId: string, at: string}):Promise<void>
    remove({commandId, targetId, userId, at}:{commandId: string, targetId: string, userId: string, at: string}):Promise<void>
}