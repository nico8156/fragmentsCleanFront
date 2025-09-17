import {OcrGateway} from "@/app/core-logic/gateways/ocrGateway";

export class FakeOcrGateway implements OcrGateway {
    recognize(imageURL: string): Promise<string> {
        return Promise.resolve("Fake OCR result");
    }
}