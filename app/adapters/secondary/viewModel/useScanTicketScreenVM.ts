import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import TextRecognition from "react-native-text-recognition";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import { uiTicketSubmitRequested } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";

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
            throw new Error("Autorise l'appareil photo pour scanner ton ticket.");
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

        const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
        if (result.canceled || result.assets.length === 0) {
            return;
        }
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setIsProcessing(true);
        try {
            const text = await recognizeText(uri);
            setOcrText(text);
        } catch (recognitionError) {
            console.error(recognitionError);
            setError("La reconnaissance du ticket a échoué. Réessaie.");
        } finally {
            setIsProcessing(false);
        }
    }, [recognizeText, requestCameraPermission]);

    const onSubmit = useCallback(() => {
        if (!imageUri && !ocrText) return;
        dispatch(uiTicketSubmitRequested({ imageRef: imageUri ?? undefined, ocrText }));
        navigation.goBack();
    }, [dispatch, imageUri, navigation, ocrText]);

    const onReset = useCallback(() => {
        setImageUri(null);
        setOcrText(null);
        setError(null);
    }, []);

    return {
        imageUri,
        ocrText,
        isProcessing,
        error,
        canSubmit: Boolean(imageUri || ocrText),
        onPickImage,
        onSubmit,
        onReset,
    } as const;
}
