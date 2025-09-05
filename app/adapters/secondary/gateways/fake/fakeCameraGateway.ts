import {CameraGateway} from "@/app/core-logic/gateways/cameraGateway";

export class FakeCamera implements CameraGateway {
    uri = "file:///tmp/src.jpg"; delayMs = 0; willFail = false;
    async capture() {
        if (this.delayMs) await new Promise(r=>setTimeout(r,this.delayMs));
        if (this.willFail) throw new Error("camera");
        return { localUri: this.uri };
    }
}