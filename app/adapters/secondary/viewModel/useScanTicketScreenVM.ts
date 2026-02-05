import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import TextRecognition from "react-native-text-recognition";
import { useDispatch } from "react-redux";

import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { uiTicketSubmitRequested } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";

type PhotoStatus = "unknown" | "ok" | "bad";

export function useScanTicketScreenVM() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const dispatch = useDispatch<any>();

	const [imageUri, setImageUri] = useState<string | null>(null);
	const [ocrText, setOcrText] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const requestCameraPermission = useCallback(async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();

		if (status !== ImagePicker.PermissionStatus.GRANTED) {
			throw new Error(
				"Autorise l'appareil photo pour scanner ton ticket."
			);
		}
	}, []);

	const recognizeText = useCallback(async (uri: string) => {
		const textBlocks = await TextRecognition.recognize(uri);
		const text = textBlocks.join("\n");
		return text.length > 0 ? text : null;
	}, []);

	const onPickImage = useCallback(async () => {
		setError(null);

		try {
			await requestCameraPermission();
		} catch (permissionError: any) {
			setError(permissionError.message ?? String(permissionError));
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: false,
			quality: 0.8,
		});

		if (result.canceled || result.assets.length === 0) {
			return;
		}

		const uri = result.assets[0].uri;

		setImageUri(uri);
		setOcrText(null);
		setIsProcessing(true);

		try {
			const text = await recognizeText(uri);
			setOcrText(text);
		} catch (recognitionError) {
			console.error(recognitionError);
			setError("La vérification du ticket a échoué. Réessaie.");
		} finally {
			setIsProcessing(false);
		}
	}, [recognizeText, requestCameraPermission]);
	const onSubmit = useCallback(() => {
		if (!imageUri) return;

		dispatch(
			uiTicketSubmitRequested({
				imageRef: imageUri,
				ocrText: ocrText ?? undefined,
			})
		);

		navigation.replace("ScanTicketSuccess");
	}, [dispatch, imageUri, navigation, ocrText]);

	// Interprétation simple de la qualité
	let photoStatus: PhotoStatus = "unknown";

	if (imageUri && !isProcessing) {
		photoStatus = ocrText ? "ok" : "bad";
	}

	return {
		imageUri,
		isProcessing,
		error,

		photoStatus,

		canSubmit: Boolean(imageUri),

		onPickImage,
		onSubmit,
	} as const;
}
