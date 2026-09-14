import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import type { LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

const MAX_IMAGE_BYTES = 8_000_000;
const MAX_IMAGE_DIMENSION = 1600;

type Source = "camera" | "library";

const launch = async (source: Source) => {
	if (source === "camera") {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) throw new Error("Autorise l’appareil photo pour prendre une image.");
		return ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 1 });
	}
	return ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["images"],
		allowsEditing: true,
		quality: 1,
		preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
	});
};

const normalizeToJpeg = async (uri: string, width: number, height: number) => {
	const context = ImageManipulator.manipulate(uri);
	if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
		if (width >= height) context.resize({ width: MAX_IMAGE_DIMENSION, height: null });
		else context.resize({ width: null, height: MAX_IMAGE_DIMENSION });
	}
	const rendered = await context.renderAsync();
	return rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
};

export const pickDurableImage = async (source: Source): Promise<LocalImageInput | undefined> => {
	const result = await launch(source);
	if (result.canceled || !result.assets[0]) return undefined;
	const asset = result.assets[0];
	const normalized = await normalizeToJpeg(asset.uri, asset.width, asset.height);

	const pendingDirectory = new Directory(Paths.document, "pending-private-media");
	pendingDirectory.create({ intermediates: true, idempotent: true });
	const destination = new File(pendingDirectory, `${Crypto.randomUUID()}.jpg`);
	const normalizedFile = new File(normalized.uri);
	normalizedFile.copy(destination);
	if (normalizedFile.exists) normalizedFile.delete();
	const size = destination.info().size ?? 0;
	if (size <= 0 || size > MAX_IMAGE_BYTES) {
		if (destination.exists) destination.delete();
		throw new Error("L’image doit peser moins de 8 Mo.");
	}
	return {
		localUri: destination.uri,
		contentType: "image/jpeg",
		size,
		width: normalized.width,
		height: normalized.height,
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
