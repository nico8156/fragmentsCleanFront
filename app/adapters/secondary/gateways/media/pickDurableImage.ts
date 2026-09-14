import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { requireOptionalNativeModule } from "expo-modules-core";

import type { LocalImageInput } from "@/app/core-logic/contextWL/experienceWl/typeAction/experience.type";

const MAX_IMAGE_BYTES = 8_000_000;
const MAX_IMAGE_DIMENSION = 1600;

type Source = "camera" | "library";
type SupportedContentType = LocalImageInput["contentType"];
type PreparedImage = {
	uri: string;
	width: number;
	height: number;
	contentType: SupportedContentType;
	temporary: boolean;
};

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
	// Loaded only when a photo is selected: an older development/TestFlight binary
	// must still be able to boot before the native module is rebuilt into the app.
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { ImageManipulator, SaveFormat } = require("expo-image-manipulator") as typeof import("expo-image-manipulator");
	const context = ImageManipulator.manipulate(uri);
	if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
		if (width >= height) context.resize({ width: MAX_IMAGE_DIMENSION, height: null });
		else context.resize({ width: null, height: MAX_IMAGE_DIMENSION });
	}
	const rendered = await context.renderAsync();
	const normalized = await rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
	return { ...normalized, contentType: "image/jpeg" as const, temporary: true };
};

const sourceFallback = (asset: ImagePicker.ImagePickerAsset): PreparedImage => {
	const fileType = new File(asset.uri).type.toLowerCase();
	const declaredType = asset.mimeType?.toLowerCase();
	const type = fileType || declaredType;
	const contentType: SupportedContentType | undefined = type === "image/png"
		? "image/png"
		: type === "image/jpeg" || type === "image/jpg" ? "image/jpeg" : undefined;
	if (!contentType) {
		throw new Error("La préparation de cette photo nécessite le nouveau build de Fragments.");
	}
	return { uri: asset.uri, width: asset.width, height: asset.height, contentType, temporary: false };
};

const prepareImage = async (asset: ImagePicker.ImagePickerAsset): Promise<PreparedImage> => {
	const nativeManipulator = requireOptionalNativeModule("ExpoImageManipulator");
	if (!nativeManipulator) return sourceFallback(asset);
	return normalizeToJpeg(asset.uri, asset.width, asset.height);
};

export const pickDurableImage = async (source: Source): Promise<LocalImageInput | undefined> => {
	const result = await launch(source);
	if (result.canceled || !result.assets[0]) return undefined;
	const asset = result.assets[0];
	const prepared = await prepareImage(asset);

	const pendingDirectory = new Directory(Paths.document, "pending-private-media");
	pendingDirectory.create({ intermediates: true, idempotent: true });
	const extension = prepared.contentType === "image/png" ? ".png" : ".jpg";
	const destination = new File(pendingDirectory, `${Crypto.randomUUID()}${extension}`);
	const preparedFile = new File(prepared.uri);
	preparedFile.copy(destination);
	if (prepared.temporary && preparedFile.exists) preparedFile.delete();
	const size = destination.info().size ?? 0;
	if (size <= 0 || size > MAX_IMAGE_BYTES) {
		if (destination.exists) destination.delete();
		throw new Error("L’image doit peser moins de 8 Mo.");
	}
	return {
		localUri: destination.uri,
		contentType: prepared.contentType,
		size,
		width: prepared.width,
		height: prepared.height,
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
