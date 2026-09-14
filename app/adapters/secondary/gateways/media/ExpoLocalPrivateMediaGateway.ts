import { File } from "expo-file-system";

import type { LocalPrivateMediaGateway } from "@/app/core-logic/contextWL/outboxWl/gateway/localPrivateMedia.gateway";

const APP_OWNED_MEDIA_DIRECTORY = "/pending-private-media/";

export class ExpoLocalPrivateMediaGateway implements LocalPrivateMediaGateway {
	discard(localUri: string): void {
		if (!localUri.startsWith("file:") || !localUri.includes(APP_OWNED_MEDIA_DIRECTORY)) return;
		try {
			const file = new File(localUri);
			if (file.exists) file.delete();
		} catch {
			// App-owned storage cleanup is best effort after server reconciliation.
		}
	}
}

export const expoLocalPrivateMediaGateway = new ExpoLocalPrivateMediaGateway();
