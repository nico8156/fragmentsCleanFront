import React, { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";

import { CommentItemVM } from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import { palette } from "@/app/adapters/primary/react/css/colors";
import EditModal from "@/app/adapters/primary/react/features/map/components/EditModal";

type Props = {
    comment: CommentItemVM;
    onUpdateComment: (newBody: string) => void;
    onDeleteComment: () => void;
};

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

const ExistingComment = ({ comment, onUpdateComment, onDeleteComment }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [draftBody, setDraftBody] = useState(comment.body);

    useEffect(() => {
        if (!isEditingBody) {
            setDraftBody(comment.body);
        }
    }, [comment.body, isEditingBody]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSelectEdit = () => {
        setIsModalOpen(false);
        setDraftBody(comment.body);
        setIsEditingBody(true);
    };

    const handleSaveEdit = () => {
        const trimmed = draftBody.trim();
        if (!trimmed || trimmed === comment.body.trim()) {
            setIsEditingBody(false);
            return;
        }
        onUpdateComment(trimmed);
        setIsEditingBody(false);
    };

    const handleDelete = () => {
        setIsModalOpen(false);
        onDeleteComment();
    };

    const handleReport = () => {
        setIsModalOpen(false);
        Alert.alert("Signalé", "Merci pour votre signalement.");
    };

    const handleCancelEdit = () => {
        setDraftBody(comment.body);
        setIsEditingBody(false);
    };

    return (
        <View
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
                <Pressable style={styles.commentHeaderMeta} onPress={handleOpenModal}>
                    <SymbolView name="ellipsis" size={18} tintColor="black" />
                </Pressable>
                {isModalOpen && (
                    <EditModal
                        closeModal={handleCloseModal}
                        isAuthor={comment.isAuthor}
                        onDelete={handleDelete}
                        onEdit={handleSelectEdit}
                        onReport={handleReport}
                    />
                )}
            </View>
            <View>
                {isEditingBody ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            value={draftBody}
                            onChangeText={setDraftBody}
                            style={styles.editInput}
                            multiline
                            autoFocus
                        />
                        <View style={styles.editActions}>
                            <Pressable style={styles.secondaryButton} onPress={handleCancelEdit}>
                                <Text style={styles.secondaryButtonText}>Annuler</Text>
                            </Pressable>
                            <Pressable style={styles.primaryButton} onPress={handleSaveEdit}>
                                <Text style={styles.primaryButtonText}>Enregistrer</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.commentBody}>{comment.body}</Text>
                )}
            </View>
            <View>
                <Text style={styles.dateFromComment}>{comment.relativeTime}</Text>
                <View style={styles.statusBadge}>
                    <View
                        style={[
                            styles.statusLight,
                            { backgroundColor: STATUS_COLORS[comment.transportStatus] },
                        ]}
                    />
                    <Text style={styles.statusText}>{STATUS_LABELS[comment.transportStatus]}</Text>
                </View>

            </View>
        </View>
    );
};

export default ExistingComment;

const styles = StyleSheet.create({
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
    commentUserHeader: {
        flexDirection: "row",
        alignItems: "center",
        minWidth: 0,
        gap: 8,
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
        flexShrink: 0,
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
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
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
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: palette.textPrimary_30,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    editContainer: {
        gap: 8,
    },
    editInput: {
        borderWidth: 1,
        borderColor: palette.accent_60,
        borderRadius: 12,
        padding: 8,
        minHeight: 80,
        textAlignVertical: "top",
        color: palette.background_1,
        backgroundColor: palette.textPrimary_1,
    },
    editActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
    secondaryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.textMuted_30,
    },
    secondaryButtonText: {
        color: palette.background_1,
        fontWeight: "600",
    },
    primaryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: palette.success_1,
    },
    primaryButtonText: {
        color: palette.textPrimary,
        fontWeight: "700",
    },
});
