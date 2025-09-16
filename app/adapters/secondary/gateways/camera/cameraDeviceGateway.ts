import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {CameraDeviceApiHandler} from "@/app/adapters/secondary/gateways/camera/cameraDeviceApiHandler";

export class CameraDeviceGateway implements CameraGateway{

    constructor(private readonly cameraDeviceApiHandler: CameraDeviceApiHandler) {}

    capture(): Promise<{ localUri: string; }> {
        throw new Error("Method not implemented.");
    }
}