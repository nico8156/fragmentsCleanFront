import {CoffeeGateway} from "@/app/core-logic/gateways/coffeeGateway";
import {CommentGateway} from "@/app/core-logic/gateways/commentGateway";

export type Gateways = {
    coffeeGateway: CoffeeGateway;
    commentGateway: CommentGateway;
};

const coffeeGateway = new GoogleApiCoffeeGateway(
    new HttpGoogleApicoffeeLoader(),
);

const commentGateway = new FragmentsApiCommenGateway(
    new HttpFragmentsApiCommentLoader()
)

export const gateways: Gateways = {
    coffeeGateway, commentGateway
};
