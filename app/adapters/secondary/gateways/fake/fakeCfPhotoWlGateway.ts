import {CfPhotoGateway} from "@/app/contextWL/cfPhotosWl/gateway/cfPhoto.gateway";
import {photoData} from "@/assets/data/photo";

export class FakeCfPhotoWlGateway implements CfPhotoGateway {
    async getAllphotos(){
     return {data: photoData}
}}