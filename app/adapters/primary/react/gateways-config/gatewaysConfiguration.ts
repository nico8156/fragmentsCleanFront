import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import {AuthGateway} from "@/app/core-logic/gateways/authGateway";
import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";
import {oAuthServerGateway} from "@/app/core-logic/gateways/oAuthServerGateway";
import {oAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import {SecureStoreGateway} from "@/app/core-logic/gateways/secureStoreGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
    commentGateway: CommentGateway;
    likeGateway: LikeGateway;
    authGateway: AuthGateway;
    cameraGateway: CameraGateway;
    storageGateway: PhotoStorageGateway;
    ticketApiGateway: RemoteTicketMetaGateway;
    validityGateway: TicketUploadGateway;
    oAuthServerGateway: oAuthServerGateway;
    oAuthGoogleGateway: oAuthGoogleGateway;
    secureStorageGateway: SecureStoreGateway;
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
const validityGateway = new fragmentsUploader(
    new httpFragmentsUploader()
)
const storageGateway = new fragmentsStorage(
    new localDeviceStorage()
)
const ticketApiGateway = new fragmentsApiTicket(
    new httpFragmentsTicketRepo()
)
const cameraGateway = new CameraDevice(
    new cameraUserDevice()
)
const oAuthServerGateway = new oAuthServer(
    new httpOAuth()
)
const oAuthGoogleGateway = new oAuthGoogle(
    new httpOAuthGoogle()
)
const secureStorageGateway = new secureStoreG(
    new deviceStorageG()
)
export const gateways: Gateways = {
    coffeeGateway, commentGateway, likeGateway, authGateway, cameraGateway, ticketApiGateway, storageGateway, validityGateway, oAuthServerGateway, oAuthGoogleGateway,secureStorageGateway
};
