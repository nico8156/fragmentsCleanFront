import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Keyboard, TextInput } from "react-native";


type CommentsAreaProps = {
    onFocusComment?: () => void;
    onBlurComment?: () => void;
};


const CommentsArea = ({ onFocusComment, onBlurComment }: CommentsAreaProps) => {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        if (!text.trim()) return;

        // TODO: envoyer le commentaire

        Keyboard.dismiss();
        setText("");
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.inputText}
                placeholder="Écrivez votre commentaire ici"
                onChangeText={setText}
                value={text}
                keyboardType="default"
                multiline
                numberOfLines={4}
                maxLength={250}
                onFocus={onFocusComment}
                onBlur={onBlurComment}
            />

            <Pressable
                style={[
                    styles.buttonInput,
                    text.length > 0 && styles.buttonInputActive,
                ]}
                onPress={handleSubmit}
            >
                <Text style={styles.buttonText}>Commenter</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "white", // ou palette.textPrimary_1
    },
    inputText: {
        minHeight: 80,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        textAlignVertical: "top",
    },
    buttonInput: {
        marginTop: 8,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
        opacity: 0.5,
    },
    buttonInputActive: {
        opacity: 1,
    },
    buttonText: {
        fontWeight: "600",
    },
});

export default CommentsArea;
