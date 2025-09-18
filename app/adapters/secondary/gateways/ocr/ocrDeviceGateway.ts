import {OcrGateway} from "@/app/core-logic/gateways/ocrGateway";
import {OcrApiHandler} from "@/app/adapters/secondary/gateways/ocr/ocrApiHandler";

export class OcrDeviceGateway implements OcrGateway{

    constructor(private readonly ocrApiHandler: OcrApiHandler) {}

    recognize(imageURL: string): Promise<string[]> {
        return this.ocrApiHandler.extractText(imageURL);
    }

}