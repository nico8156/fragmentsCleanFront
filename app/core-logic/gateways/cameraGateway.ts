export interface CameraGateway {
    capture(): Promise<{ localUri: string }>
}