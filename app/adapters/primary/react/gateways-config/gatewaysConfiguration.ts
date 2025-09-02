import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";
import {LikeGateway} from "@/app/core-logic/gateways/likeGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
    commentGateway: CommentGateway;
    likeGateway: LikeGateway;
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

export const gateways: Gateways = {
    coffeeGateway, commentGateway, likeGateway
};
