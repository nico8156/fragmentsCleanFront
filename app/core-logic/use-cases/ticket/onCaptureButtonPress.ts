import {onTicketCaptured} from "@/app/core-logic/use-cases/ticket/onTicketCaptured";
import {AppThunk} from "@/app/store/reduxStore";

export const onCaptureButtonPress =
    (): AppThunk<Promise<void>> =>
        async(dispatch, getState, {cameraGateway})=>{
    //TODO faire un systeme de toast pour afficehr les erreurs ? + normaliser la reponse ?
    const permission = await cameraGateway.getPermission();
    if (permission !== "granted") return;
    const res = await cameraGateway.capture();
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    await dispatch(onTicketCaptured({ imageUri: asset.uri }));
}
//TODO comparer avec enum ?
export enum permissions {
    GRANTED = "granted",
    DENIED = "denied",
    UNDETERMINED = "undetermined"
}