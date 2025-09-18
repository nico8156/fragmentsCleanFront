import {OcrApiHandler} from "@/app/adapters/secondary/gateways/ocr/ocrApiHandler";
import TextRecognition from 'react-native-text-recognition';

export class OcrTextRecognitionApiHandler implements OcrApiHandler{
    async extractText(imageURL: string): Promise<string[]> {
        const result = await TextRecognition.recognize(imageURL);
        return result;
    }

}