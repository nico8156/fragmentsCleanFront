import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Keyboard, TextInput } from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";
import {Image} from "expo-image";
import {SymbolView} from "expo-symbols";


type CommentsAreaProps = {
    onFocusComment?: () => void;
    onBlurComment?: () => void;
};


const CommentsArea = ({ onFocusComment, onBlurComment }: CommentsAreaProps) => {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        if (!text.trim() || text.length < 3) return;

        // TODO: envoyer le commentaire

        Keyboard.dismiss();
        setText("");
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.sectionTitle}>
                    Commentaires
                </Text>
            </View>
            <View style={styles.commentContainer}>
                <View style={styles.commentHeader}>
                    <View style={styles.commentUserHeader}>
                        <Image source={{uri: "https://picsum.photos/200"}} style={{width: 30, height: 30, borderRadius: 15}}/>
                        <Text style={styles.userName}>
                            un user
                        </Text>
                    </View>
                    <View>
                        <SymbolView name={"ellipsis"} size={18} tintColor={"black"}/>
                    </View>
                </View>
                <View>
                    <Text>C'est un endroit magique </Text>
                </View>
                <Text style={styles.dateFromComment}>12a</Text>
            </View>
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
        borderColor: "#ddd",
        backgroundColor: palette.textPrimary_1,
        gap:16
    },
    sectionTitle:{
        fontSize: 18,
        fontWeight: '600',
        color: palette.background_1,
    },
    commentContainer:{
      borderWidth:1,
        minHeight: 120,
      borderColor: palette.textMuted_30,
        borderRadius: 18,
        padding:12,
        gap: 10,
    },
    commentHeader:{
      flexDirection:"row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    commentUserHeader:{
      flexDirection:"row",
        alignItems: "center",
        gap: 5
    },
    userName:{
        fontSize:16,
      fontWeight: "600"
    },
    dateFromComment:{
        fontWeight:"500",
        color: palette.background_30,
        marginBottom:15
    },
    inputText: {
        backgroundColor: palette.textPrimary_1,
        minHeight: 120,
        borderWidth: 1,
        borderColor: palette.accent_60,
        borderRadius: 18,
        paddingHorizontal: 10,
        paddingVertical: 5,
        textAlignVertical: "top",
    },
    buttonInput: {
        backgroundColor: palette.success_80,
        borderWidth: 1,
        borderColor: palette.success_80,
        marginTop: 8,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        opacity: 0.5,
    },
    buttonInputActive: {
        backgroundColor: palette.success_1,
        opacity: 1,
    },
    buttonText: {
        color: palette.textPrimary,
        fontWeight: "600",
    },
});

export default CommentsArea;
