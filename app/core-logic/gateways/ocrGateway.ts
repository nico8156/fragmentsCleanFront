export interface OcrGateway {
    recognize (imageURL: string): Promise<string[]>
}