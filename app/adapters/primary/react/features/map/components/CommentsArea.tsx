import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";

import { palette } from "@/app/adapters/primary/react/css/colors";
import { useCommentsForCafe } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { CafeId } from "@/app/core-logic/contextWL/commentWl/type/commentWl.type";
import {parseToCoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

const STATUS_COLORS = {
    pending: palette.warning_70,
    success: palette.success_1,
    failed: palette.danger_1,
} as const;

const STATUS_LABELS = {
    pending: "En validation",
    success: "Validé",
    failed: "Erreur",
} as const;

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
                        <View
                            key={comment.id}
                            style={[
                                styles.commentContainer,
                                comment.isOptimistic && styles.commentContainerOptimistic,
                                comment.transportStatus === "failed" && styles.commentContainerFailed,
                            ]}
                        >
                            <View style={styles.commentHeader}>
                                <View style={styles.commentUserHeader}>
                                    <Image source={{ uri: comment.avatarUrl }} style={styles.avatar} />
                                    <Text style={styles.userName}>{comment.authorName}</Text>
                                </View>
                                <View style={styles.commentHeaderMeta}>
                                    <View style={styles.statusBadge}>
                                        <View
                                            style={[
                                                styles.statusLight,
                                                { backgroundColor: STATUS_COLORS[comment.transportStatus] },
                                            ]}
                                        />
                                        <Text style={styles.statusText}>{STATUS_LABELS[comment.transportStatus]}</Text>
                                    </View>
                                    <SymbolView name="ellipsis" size={18} tintColor="black" />
                                </View>
                            </View>
                            <View>
                                <Text style={styles.commentBody}>{comment.body}</Text>
                            </View>
                            <Text style={styles.dateFromComment}>{comment.relativeTime}</Text>
                        </View>
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
    commentContainer: {
        borderWidth: 1,
        borderColor: palette.textMuted_30,
        borderRadius: 18,
        padding: 12,
        gap: 10,
    },
    commentContainerOptimistic: {
        opacity: 0.7,
    },
    commentContainerFailed: {
        borderColor: palette.danger_60 ?? palette.danger,
    },
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    commentHeaderMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    commentUserHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: palette.background_1,
    },
    commentBody: {
        color: palette.background_1,
        fontSize: 14,
        lineHeight: 20,
    },
    dateFromComment: {
        fontWeight: "500",
        color: palette.background_30,
        marginBottom: 4,
        fontSize: 12,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: palette.textPrimary_30,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusLight: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        color: palette.background_1,
        fontSize: 12,
        fontWeight: "600",
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
