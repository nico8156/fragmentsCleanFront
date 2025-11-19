import {CommentItemVM} from "@/app/adapters/secondary/viewModel/useCommentsForCafe";
import {Pressable, Text, View} from "react-native";
import {Image} from "expo-image";
import {SymbolView} from "expo-symbols";
import React, {useState} from "react";
import {palette} from "@/app/adapters/primary/react/css/colors";
import EditModal from "@/app/adapters/primary/react/features/map/components/EditModal";

type Props = {
    comment:CommentItemVM;
}

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




const ExistingComment = (props:Props) => {

    const [isEditing, setIsEditing] = useState(false);

    const handleEditPress = () => {
        setIsEditing(true);

    }

    const {comment} = props;
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
                <Pressable style={styles.commentHeaderMeta} onPress={handleEditPress}>
                    <SymbolView name="ellipsis" size={18} tintColor="black" />
                </Pressable>
                {isEditing && <EditModal closeModal={()=>setIsEditing(false)}/>}
            </View>
            <View>
                <Text style={styles.commentBody}>{comment.body}</Text>
            </View>
            <View>
                <Text style={styles.dateFromComment}>{comment.relativeTime}</Text><View style={styles.statusBadge}>
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
}

export default ExistingComment;

const styles = {
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
        minWidth:0,
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
}