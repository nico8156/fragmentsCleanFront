import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { palette } from "@/constants/colors";
import { RootStackNavigationProp } from "@/src/navigation/types";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { useDistanceToPoint } from "@/app/adapters/secondary/viewModel/useDistanceToPoint";

const { height } = Dimensions.get("window");
const SHEET_HEIGHT = height;

const SNAP_POINTS = {
    full: 0,
    half: SHEET_HEIGHT * 0.45,
    closed: SHEET_HEIGHT,
} as const;

type SnapPoint = keyof typeof SNAP_POINTS;

type Props = {
    coffeeId?: string | null;
    onRequestClose: () => void;
};

export function CafeBottomSheet({ coffeeId, onRequestClose }: Props) {
    const translateY = useRef(new Animated.Value(SNAP_POINTS.closed)).current;
    const currentValue = useRef(SNAP_POINTS.closed);
    const currentSnap = useRef<SnapPoint>("closed");

    const snapTo = useCallback(
        (snap: SnapPoint, emitClose?: boolean) => {
            currentSnap.current = snap;
            currentValue.current = SNAP_POINTS[snap];
            Animated.spring(translateY, {
                toValue: SNAP_POINTS[snap],
                useNativeDriver: true,
                damping: 18,
                stiffness: 160,
            }).start(() => {
                if (snap === "closed" && emitClose) {
                    onRequestClose();
                }
            });
        },
        [onRequestClose, translateY],
    );

    useEffect(() => {
        if (coffeeId) {
            snapTo("half");
        } else {
            snapTo("closed");
        }
    }, [coffeeId, snapTo]);

    const panResponder = useMemo(() => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                translateY.stopAnimation((value) => {
                    currentValue.current = typeof value === "number" ? value : SNAP_POINTS.closed;
                });
            },
            onPanResponderMove: (_, gesture) => {
                const next = Math.min(
                    SNAP_POINTS.closed,
                    Math.max(SNAP_POINTS.full, currentValue.current + gesture.dy),
                );
                translateY.setValue(next);
            },
            onPanResponderRelease: (_, gesture) => {
                const endValue = currentValue.current + gesture.dy;
                const velocity = gesture.vy;

                if (velocity > 1.2) {
                    snapTo("closed", true);
                    return;
                }
                if (velocity < -1) {
                    snapTo("full");
                    return;
                }

                const targets = [SNAP_POINTS.full, SNAP_POINTS.half, SNAP_POINTS.closed];
                const closest = targets.reduce((prev, curr) =>
                    Math.abs(curr - endValue) < Math.abs(prev - endValue) ? curr : prev,
                );

                if (closest === SNAP_POINTS.closed) {
                    snapTo("closed", true);
                } else if (closest === SNAP_POINTS.full) {
                    snapTo("full");
                } else {
                    snapTo("half");
                }
            },
        });
    }, [snapTo, translateY]);

    return (
        <Animated.View
            pointerEvents={coffeeId ? 'auto' : 'none'}
            style={[styles.container, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
        >
            <View style={styles.handle} />
            {coffeeId ? <CafeSheetContent coffeeId={coffeeId} onRequestClose={() => snapTo("closed", true)} /> : null}
        </Animated.View>
    );
}

type ContentProps = {
    coffeeId: string;
    onRequestClose: () => void;
};

function CafeSheetContent({ coffeeId, onRequestClose }: ContentProps) {
    const navigation = useNavigation<RootStackNavigationProp>();
    const parsedId = parseToCoffeeId(coffeeId);
    const { coffee } = useCafeFull(parsedId);
    const isOpen = useCafeOpenNow(parsedId);
    const distance = useDistanceToPoint(
        coffee ? { lat: coffee.location.lat, lng: coffee.location.lon } : undefined,
    );

    if (!coffee) {
        return null;
    }

    const openColor = isOpen ? palette.success : palette.danger;

    return (
        <View style={styles.content}>
            <View style={styles.sheetHeader}>
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>{coffee.name}</Text>
                    {coffee.address.line1 ? (
                        <Text style={styles.subtitle}>{coffee.address.line1}</Text>
                    ) : null}
                    {coffee.address.city ? (
                        <Text style={styles.subtitleMuted}>{coffee.address.city}</Text>
                    ) : null}
                </View>
                <Pressable onPress={onRequestClose} style={styles.closeButton} accessibilityRole="button">
                    <SymbolView name="xmark.circle.fill" size={24} tintColor="rgba(255,255,255,0.28)" />
                </Pressable>
            </View>

            <Image source={coffee.photos[0]} style={styles.hero} contentFit="cover" />

            <View style={styles.badgeRow}>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: isOpen ? "rgba(79,178,142,0.18)" : "rgba(224,92,75,0.18)" },
                    ]}
                >
                    <SymbolView name={isOpen ? "sun.max.fill" : "moon.zzz"} size={16} tintColor={openColor} />
                    <Text style={[styles.statusText, { color: openColor }]}>{isOpen ? "Ouvert" : "Fermé"}</Text>
                </View>
                {distance.text ? <Text style={styles.distance}>{distance.text}</Text> : null}
            </View>

            {coffee.tags?.length ? (
                <View style={styles.tagsRow}>
                    {coffee.tags.slice(0, 3).map((tag) => (
                        <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            <View style={styles.actions}>
                <Pressable
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate("CafeDetails", { id: coffee.id.toString() })}
                >
                    <Text style={styles.primaryButtonLabel}>Voir la fiche</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SHEET_HEIGHT,
        backgroundColor: palette.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 14,
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    handle: {
        alignSelf: "center",
        width: 52,
        height: 5,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginBottom: 12,
    },
    content: {
        flex: 1,
        gap: 18,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    titleBlock: {
        flex: 1,
        gap: 6,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: palette.textPrimary,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    subtitleMuted: {
        fontSize: 13,
        color: palette.textMuted,
    },
    closeButton: {
        padding: 4,
    },
    hero: {
        width: "100%",
        height: 200,
        borderRadius: 24,
        backgroundColor: palette.overlay,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 13,
        fontWeight: "600",
    },
    distance: {
        fontSize: 13,
        color: palette.textMuted,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: palette.overlay,
    },
    tagText: {
        fontSize: 12,
        color: palette.textSecondary,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    actions: {
        marginTop: "auto",
    },
    primaryButton: {
        backgroundColor: palette.accent,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: "center",
    },
    primaryButtonLabel: {
        color: "#1C0E08",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});

export default CafeBottomSheet;
