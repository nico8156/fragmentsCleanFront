import {CfPhotoGateway} from "@/app/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import {photoData} from "@/assets/data/photo";

export class FakeCfPhotoWlGateway implements CfPhotoGateway {
    willFail = false;

    async getAllphotos(){
        if (this.willFail) {
            throw new Error('fake error from photo gateway')
        }
     return {data: photoData}
}}