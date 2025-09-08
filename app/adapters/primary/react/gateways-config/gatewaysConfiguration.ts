import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import {AuthGateway} from "@/app/core-logic/gateways/authGateway";
import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
    commentGateway: CommentGateway;
    likeGateway: LikeGateway;
    authGateway: AuthGateway;
    cameraGateway: CameraGateway;
    storageGateway: PhotoStorageGateway;
    ticketApiGateway: RemoteTicketMetaGateway;
    validityGateway: TicketUploadGateway;
};

const coffeeGateway = new GoogleApiCoffeeGateway(
    new HttpGoogleApicoffeeLoader(),
);
const commentGateway = new FragmentsApiCommenGateway(
    new HttpFragmentsApiCommentLoader()
)
const likeGateway = new FragmntsApiLikeGateway(
    new HttpFragmentsApiLikeLoader()
)
const authGateway = new FragmentsApiAuthGateway(
    new httpGoogleAuthLoader()
)
const uploader = new fragmentsUploader(
    new httpFragmentsUploader()
)
const storage = new fragmentsStorage(
    new localDeviceStorage()
)
const repo = new fragmentsApiTicket(
    new httpFragmentsTicketRepo()
)
const camera = new CameraDevice(
    new cameraUserDevice()
)
export const gateways: Gateways = {
    coffeeGateway, commentGateway, likeGateway, authGateway, camera, repo, storage, uploader
};
