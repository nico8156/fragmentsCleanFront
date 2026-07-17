import {CfPhotoGateway} from "@/app/core-logic/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import {photoData} from "@/assets/data/photo";

export class FakeCfPhotoWlGateway implements CfPhotoGateway {
    willFail = false;
    getCalls = 0;

    async getAllphotos(){
        this.getCalls += 1;
        if (this.willFail) {
            throw new Error('fake error from photo gateway')
        }
     return {data: photoData}
}}
