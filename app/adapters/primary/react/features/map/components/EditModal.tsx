import React from "react";
import {
    Dimensions,
    GestureResponderEvent,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SymbolView } from "expo-symbols";

import { palette } from "@/app/adapters/primary/react/css/colors";

type Props = {
    closeModal: (event?: GestureResponderEvent) => void;
    isAuthor: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onReport: () => void;
};

const EditModal = ({ closeModal, isAuthor, onEdit, onDelete, onReport }: Props) => {
    const stopPropagation = (event: GestureResponderEvent) => {
        event.stopPropagation();
    };

    return (
        <Modal transparent animationType="fade" onRequestClose={closeModal}>
            <Pressable onPress={closeModal} style={styles.inlay}>
                <View style={styles.container}>
                    {isAuthor ? (
                        <>
                            <Pressable style={styles.button} onPress={(event) => { stopPropagation(event); onEdit(); }}>
                                <SymbolView name="pencil" size={22} tintColor={palette.background_1} />
                                <Text style={styles.buttonLabel}>Éditer</Text>
                            </Pressable>
                            <Pressable style={styles.button} onPress={(event) => { stopPropagation(event); onDelete(); }}>
                                <SymbolView name="trash" size={22} tintColor={palette.danger} />
                                <Text style={[styles.buttonLabel, styles.deleteLabel]}>Supprimer</Text>
                            </Pressable>
                        </>
                    ) : (
                        <Pressable style={styles.button} onPress={(event) => { stopPropagation(event); onReport(); }}>
                            <SymbolView name="exclamationmark.bubble" size={22} tintColor={palette.warning_70} />
                            <Text style={styles.buttonLabel}>Signaler</Text>
                        </Pressable>
                    )}
                </View>
            </Pressable>
        </Modal>
    );
};

export default EditModal;

const styles = StyleSheet.create({
    inlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        zIndex: 101,
        borderRadius: 16,
        backgroundColor: palette.textPrimary,
        borderWidth: 1,
        borderColor: palette.textMuted_30,
        flexDirection: "column",
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 12,
        minWidth: Math.min(Dimensions.get("window").width - 80, 280),
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 6,
    },
    buttonLabel: {
        color: palette.background_1,
        fontSize: 16,
        fontWeight: "600",
    },
    deleteLabel: {
        color: palette.danger,
    },
});
