import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";
import {AuthGateway} from "@/app/core-logic/gateways/authGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
    commentGateway: CommentGateway;
    likeGateway: LikeGateway;
    authGateway: AuthGateway;
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

export const gateways: Gateways = {
    coffeeGateway, commentGateway, likeGateway, authGateway
};
