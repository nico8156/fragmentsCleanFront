import * as ImagePicker from "expo-image-picker";
import {ImagePickerResult} from "expo-image-picker";

export interface CameraDeviceApiHandler {
    getPermissionFromUser(): Promise<ImagePicker.PermissionStatus>
    capture(): Promise<ImagePickerResult>
}