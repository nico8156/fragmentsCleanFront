import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {CameraDeviceApiHandler} from "@/app/adapters/secondary/gateways/camera/cameraDeviceApiHandler";
import * as ImagePicker from "expo-image-picker";
import {ImagePickerResult} from "expo-image-picker";


export class CameraDeviceGateway implements CameraGateway{

    constructor(private readonly cameraDeviceApiHandler: CameraDeviceApiHandler) {}

    getPermission(): Promise<ImagePicker.PermissionStatus> {
        return this.cameraDeviceApiHandler.getPermissionFromUser();
    }

    capture(): Promise<ImagePickerResult> {
        return this.cameraDeviceApiHandler.capture();
    }
}