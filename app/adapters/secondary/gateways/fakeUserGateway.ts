import {UserGateway} from "@/app/core-logic/gateways/userGateway";

export class FakeUserGateway implements UserGateway {
    logUserIn(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logUserOut(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    registerUser(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}