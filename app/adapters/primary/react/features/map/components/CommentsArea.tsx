import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useCommentsForCafe } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { CafeId } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import {parseToCoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import ExistingComment from "@/app/adapters/primary/react/features/map/components/ExistingComment";

type CommentsAreaProps = {
    coffeeId?: CafeId | null;
    onFocusComment?: () => void;
    onBlurComment?: () => void;
};

const CommentsArea = ({ coffeeId, onFocusComment, onBlurComment }: CommentsAreaProps) => {

    const [text, setText] = useState("");

    const { comments, isLoading, error, isRefreshing, uiViaHookCreateComment } = useCommentsForCafe(coffeeId ?? undefined);

    const canSubmit = useMemo(() => {
        if (!coffeeId) return false;
        const trimmed = text.trim();
        return trimmed.length >= 3;
    }, [coffeeId, text]);

    const handleSubmit = useCallback(() => {
        if (!canSubmit || !coffeeId) return;

        uiViaHookCreateComment({targetId:parseToCoffeeId(coffeeId), body:text.trim()})

        Keyboard.dismiss();
        setText("");
    }, [canSubmit, coffeeId, text]);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Commentaires</Text>
                {(isLoading || isRefreshing) && <ActivityIndicator size="small" color={palette.accent} />}
            </View>

            {!coffeeId ? (
                <Text style={styles.emptyText}>Sélectionnez un café pour découvrir les retours.</Text>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : comments.length === 0 && !isLoading ? (
                <Text style={styles.emptyText}>Soyez la première personne à laisser un mot.</Text>
            ) : (
                <View style={styles.commentsList}>
                    {comments.map((comment) => (
                        <ExistingComment key={comment.id} comment={comment}/>
                    ))}
                </View>
            )}

            <TextInput
                style={styles.inputText}
                placeholder={coffeeId ? "Écrivez votre commentaire ici" : "Sélectionnez un café pour commenter"}
                onChangeText={setText}
                value={text}
                editable={!!coffeeId}
                keyboardType="default"
                multiline
                numberOfLines={4}
                maxLength={250}
                onFocus={onFocusComment}
                onBlur={onBlurComment}
            />
            <Pressable
                style={[styles.buttonInput, canSubmit && styles.buttonInputActive]}
                onPress={handleSubmit}
                disabled={!canSubmit}
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
        backgroundColor: palette.textPrimary_1,
        gap: 16,
        marginBottom: 160,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: palette.background_1,
    },
    commentsList: {
        gap: 12,
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
    emptyText: {
        color: palette.background_30,
    },
    errorText: {
        color: palette.danger_80 ?? "#D32F2F",
        fontWeight: "500",
    },
});

export default CommentsArea;
