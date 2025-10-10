export interface CommentGatewayWl {
    create({commandId, targetId, parentId, body}:{ commandId: string, targetId: string, parentId: string, body: string }): Promise<void>;
}