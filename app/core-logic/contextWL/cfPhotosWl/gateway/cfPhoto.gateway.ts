import {PhotoURI} from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.type";

export interface CfPhotoGateway {
    getAllphotos: () => Promise<{data: PhotoURI[] }>
}