import {OAuthGoogleGateway} from "@/app/core-logic/gateways/oAuthGoogleGateway";
import { RedirectUriType, CodeProviderType } from "@/app/core-logic/use-cases/auth/oAuthFlow/onOAuthFlow";

export class FakeGoogleOAuth implements OAuthGoogleGateway {

    public willFailCode: boolean = false;
    public willSendWrongState: boolean = false;
    public willSendDismissType: boolean = false;
    public wontSendCode: boolean = false;
    public willSendOtherType: boolean = false;

    async googleCodeProvider(returnUrlRequest: RedirectUriType): Promise<CodeProviderType> {
        if (this.willFailCode) throw new Error("google_server_error_code");
        if (this.willSendWrongState){
            await new Promise((r) => setTimeout(r, 0));
            return {
                type: "success",
                params: {
                    code: "fake-code",
                    state: "stateId-for-fake-server-but-wrong",
                },
            };
        };
        if (this.willSendDismissType){
            await new Promise((r) => setTimeout(r, 0));
            return {
                type: "dismiss",
                params: {
                    code: "fake-code",
                    state: "stateId-for-fake-server",
                },
            };
        };
        if (this.willSendOtherType){
            await new Promise((r) => setTimeout(r, 0));
            return {
                type: "other",
                params: {
                    code: "fake-code",
                    state: "stateId-for-fake-server",
                },
            };
        };
        if (this.wontSendCode){
            await new Promise((r) => setTimeout(r, 0));
            return {
                type: "dismiss",
                params: {
                    code: undefined,
                    state: "stateId-for-fake-server",
                },
            };
        };
        await new Promise((r) => setTimeout(r, 0));
        return {
            type: "success",
            params: {
                code: "fake-code",
                state: "stateId-for-fake-server",
            },
        };
    }
}