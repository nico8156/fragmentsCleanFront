// canEditComment.ts
export function canEditComment({
                                   editorId, authorId, newContent,
                               }: { editorId:string; authorId:string; newContent:string }) {
    if (!newContent || newContent.trim().length === 0) {
        return { status:false as const, reason:"EMPTY_CONTENT" as const };
    }
    if (editorId !== authorId) {
        return { status:false as const, reason:"NOT_AUTHOR" as const };
    }
    return { status:true as const };
}
