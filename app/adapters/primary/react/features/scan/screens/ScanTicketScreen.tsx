import { useState, useCallback } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import TextRecognition from "react-native-text-recognition";
import { useDispatch } from "react-redux";
import { uiTicketSubmitRequested } from "@/app/core-logic/contextWL/ticketWl/usecases/write/ticketSubmitWlUseCase";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";

export function ScanTicketScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const dispatch = useDispatch<any>();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [ocrText, setOcrText] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePickImage = useCallback(async () => {
        setError(null);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== ImagePicker.PermissionStatus.GRANTED) {
            setError("Autorise l'appareil photo pour scanner ton ticket.");
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
        setIsProcessing(true);
        try {
            const textBlocks = await TextRecognition.recognize(uri);
            const text = textBlocks.join('\n');
            setOcrText(text.length > 0 ? text : null);
        } catch (recognitionError) {
            setError("La reconnaissance du ticket a échoué. Réessaie.");
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleSubmit = useCallback(() => {
        if (!imageUri && !ocrText) return;
        dispatch(uiTicketSubmitRequested({ imageRef: imageUri ?? undefined, ocrText }));
        navigation.goBack();
    }, [dispatch, imageUri, navigation, ocrText]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Scanner un ticket</Text>
            <Text style={styles.subtitle}>
                Capture ton ticket pour enregistrer ta visite et débloquer des récompenses.
            </Text>
            <Pressable
                style={({ pressed }) => [styles.captureButton, pressed && styles.captureButtonPressed]}
                onPress={handlePickImage}
            >
                <Text style={styles.captureLabel}>{imageUri ? 'Reprendre une photo' : 'Prendre une photo'}</Text>
            </Pressable>
            {isProcessing ? (
                <View style={styles.processing}>
                    <ActivityIndicator size="small" color="#1C1C1E" />
                    <Text style={styles.processingText}>Analyse du ticket…</Text>
                </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : null}
            {ocrText ? (
                <View style={styles.ocrCard}>
                    <Text style={styles.ocrTitle}>Texte détecté</Text>
                    <Text style={styles.ocrContent}>{ocrText}</Text>
                </View>
            ) : null}
            <Pressable
                style={({ pressed }) => [
                    styles.submitButton,
                    (imageUri || ocrText) ? undefined : styles.submitButtonDisabled,
                    pressed && (imageUri || ocrText) ? styles.submitButtonPressed : undefined,
                ]}
                onPress={handleSubmit}
                disabled={!imageUri && !ocrText}
            >
                <Text style={styles.submitLabel}>Enregistrer le ticket</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F5F5',
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    subtitle: {
        fontSize: 15,
        color: '#6E6E73',
        lineHeight: 22,
    },
    captureButton: {
        marginTop: 12,
        backgroundColor: '#1C1C1E',
        paddingVertical: 14,
        borderRadius: 28,
        alignItems: 'center',
    },
    captureButtonPressed: {
        opacity: 0.85,
    },
    captureLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    processing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    processingText: {
        fontSize: 14,
        color: '#3A3A3C',
    },
    error: {
        color: '#B00020',
        fontSize: 14,
    },
    preview: {
        width: '100%',
        height: 240,
        borderRadius: 16,
    },
    ocrCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    ocrTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    ocrContent: {
        fontSize: 14,
        color: '#3A3A3C',
        lineHeight: 20,
    },
    submitButton: {
        marginTop: 16,
        backgroundColor: '#4F46E5',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    submitButtonPressed: {
        opacity: 0.85,
    },
    submitLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ScanTicketScreen;
