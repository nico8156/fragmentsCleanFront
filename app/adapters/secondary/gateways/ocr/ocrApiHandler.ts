export interface OcrApiHandler {
    extractText (imageURL: string): Promise<string[]>
}