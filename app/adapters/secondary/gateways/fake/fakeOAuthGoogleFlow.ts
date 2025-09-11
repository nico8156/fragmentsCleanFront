import {oAuthServerGateway} from "@/app/core-logic/gateways/oAuthServerGateway";

export class FakeServerOAuth implements oAuthServerGateway{
    initOAuth(url : string ): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const resp = {
                    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
                    "stateId": "<state>"
                };
                resolve(resp);
            }, 500);
        });
    }

}