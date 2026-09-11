import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import type { LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type Source = "camera" | "library";

const launch = async (source: Source) => {
	if (source === "camera") {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) throw new Error("Autorise l’appareil photo pour prendre une image.");
		return ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.82 });
	}
	const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!permission.granted) throw new Error("Autorise l’accès aux photos pour choisir une image.");
	return ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.82 });
};

export const pickDurableImage = async (source: Source): Promise<LocalImageInput | undefined> => {
	const result = await launch(source);
	if (result.canceled || !result.assets[0]) return undefined;
	const asset = result.assets[0];
	const mime = asset.mimeType?.toLowerCase();
	const contentType = mime === "image/png" ? "image/png" : mime === "image/jpeg" || mime === "image/jpg" ? "image/jpeg" : undefined;
	if (!contentType) throw new Error("Choisis une image JPEG ou PNG.");

	const pendingDirectory = new Directory(Paths.document, "pending-private-media");
	pendingDirectory.create({ intermediates: true, idempotent: true });
	const extension = contentType === "image/png" ? ".png" : ".jpg";
	const destination = new File(pendingDirectory, `${Crypto.randomUUID()}${extension}`);
	new File(asset.uri).copy(destination);
	const size = destination.info().size ?? asset.fileSize ?? 0;
	if (size <= 0 || size > MAX_IMAGE_BYTES) {
		if (destination.exists) destination.delete();
		throw new Error("L’image doit peser moins de 8 Mo.");
	}
	return {
		localUri: destination.uri,
		contentType,
		size,
		width: asset.width,
		height: asset.height,
	};
};

export const discardDurableImage = (image: LocalImageInput | undefined) => {
	if (!image) return;
	try {
		const file = new File(image.localUri);
		if (file.exists) file.delete();
	} catch {
		// Best effort: app-owned document storage remains private and can be cleaned later.
	}
};
