import {CameraDeviceApiHandler} from "@/app/adapters/secondary/gateways/camera/cameraDeviceApiHandler";
import {ImagePickerResult, PermissionStatus} from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";

export class CameraDeviceApiIOSHandler implements CameraDeviceApiHandler {
    async getPermissionFromUser(): Promise<PermissionStatus> {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status;
    }
    async capture(): Promise<ImagePickerResult> {
        const res = await ImagePicker.launchCameraAsync({
            quality: 0.85,
            exif: true,
        });
        return res;
    }

}