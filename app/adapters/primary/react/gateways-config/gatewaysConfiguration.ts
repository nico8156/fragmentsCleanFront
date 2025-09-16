import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";
import {PhotoStorageGateway} from "@/app/core-logic/gateways/photoStorageGateway";
import {RemoteTicketMetaGateway} from "@/app/core-logic/gateways/remoteTicketMetaGateway";
import {TicketUploadGateway} from "@/app/core-logic/gateways/ticketUploadGateway";
import {OAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import {SecureStoreGateway} from "@/app/core-logic/gateways/secureStoreGateway";
import {CoffeeApiGateway} from "@/app/adapters/secondary/gateways/coffee/coffeeApiGateway";
import {HttpCoffeeApiLoader} from "@/app/adapters/secondary/gateways/coffee/httpCoffeeApiLoader";
import {CommentApiGateway} from "@/app/adapters/secondary/gateways/comment/commentApiGateway";
import {HttpCommentApiHandler} from "@/app/adapters/secondary/gateways/comment/httpCommentApiHandler";
import {LikeApiGateway} from "@/app/adapters/secondary/gateways/like/likeApiGateway";
import {HttpLikeApiHandler} from "@/app/adapters/secondary/gateways/like/httpLikeApiHandler";
import {CameraDeviceGateway} from "@/app/adapters/secondary/gateways/camera/cameraDeviceGateway";
import {GoogleGateway} from "@/app/adapters/secondary/gateways/auth/google/googleGateway";
import {HttpOAuthGoogleApiHandler} from "@/app/adapters/secondary/gateways/auth/google/httpOAuthGoogleApiHandler";
import {AuthServerGateway} from "@/app/adapters/secondary/gateways/auth/server/authServerGateway";
import {HttpOAuthServerApiHandler} from "@/app/adapters/secondary/gateways/auth/server/httpOAuthServerApiHandler";
import {OAuthServerGateway} from "@/app/core-logic/gateways/oAuthServerGateway";
import {SecureStorageGateway} from "@/app/adapters/secondary/gateways/secureStorage/secureStorageGateway";
import {SecureStorageDeviceHandler} from "@/app/adapters/secondary/gateways/secureStorage/secureStorageDeviceHandler";
import {CameraDeviceApiIOSHandler} from "@/app/adapters/secondary/gateways/camera/cameraDeviceApiIOSHandler";
import {OcrGateway} from "@/app/core-logic/gateways/ocrGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
    commentGateway: CommentGateway;
    likeGateway: LikeGateway;
    cameraGateway: CameraGateway;
    storageGateway: PhotoStorageGateway;
    ticketApiGateway: RemoteTicketMetaGateway;
    validityGateway: TicketUploadGateway;
    oAuthServerGateway: OAuthServerGateway;
    oAuthGoogleGateway: OAuthGoogleGateway;
    secureStorageGateway: SecureStoreGateway;
    ocrGateway: OcrGateway;
};

const coffeeGateway = new CoffeeApiGateway(
    new HttpCoffeeApiLoader()
)
const commentGateway = new CommentApiGateway(
    new HttpCommentApiHandler()
)
const likeGateway = new LikeApiGateway(
    new HttpLikeApiHandler()
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
const cameraGateway = new CameraDeviceGateway(
    new CameraDeviceApiIOSHandler()
)
const oAuthServerGateway = new AuthServerGateway(
    new HttpOAuthServerApiHandler()
)
const oAuthGoogleGateway = new GoogleGateway(
    new HttpOAuthGoogleApiHandler()
)
const secureStorageGateway = new SecureStorageGateway(
    new SecureStorageDeviceHandler()
)
export const gateways: Gateways = {
    coffeeGateway, commentGateway, likeGateway, cameraGateway, ticketApiGateway, storageGateway, validityGateway, oAuthServerGateway, oAuthGoogleGateway,secureStorageGateway
};
