import {PhotoURI} from "@/app/contextWL/cfPhotosWl/typeAction/cfPhoto.type";

export interface CfPhotoGateway {
    getAllphotos: () => Promise<{data: PhotoURI[] }>
}