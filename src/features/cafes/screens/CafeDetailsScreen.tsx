import { useMemo, useState } from "react";
import {
    FlatList,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { RootStackParamList, RootStackNavigationProp } from "@/src/navigation/types";
import {palette} from "@/app/adapters/primary/react/css/colors";

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const DAY_ORDER: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export function CafeDetailsScreen() {
    const navigation = useNavigation<RootStackNavigationProp>();
    const route = useRoute<RouteProp<RootStackParamList, 'CafeDetails'>>();
    const coffeeId = parseToCoffeeId(route.params.id);
    const { coffee } = useCafeFull(coffeeId);
    const isOpen = useCafeOpenNow(coffeeId);

    const [showAllHours, setShowAllHours] = useState(false);

    const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex;

    const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? 'Horaires non disponibles';
    const hasHours = coffee?.hours != null;

    const openColor = isOpen ? '#34C759' : '#FF3B30';
    const openBackground = isOpen ? 'rgba(52,199,89,0.14)' : 'rgba(255,59,48,0.16)';
    const openIcon = isOpen ? 'sun.max.fill' : 'moon.zzz';
    const openText = isOpen ? 'Ouvert actuellement' : 'Actuellement fermé';

    const handleClose = () => {
        navigation.goBack();
    };

    const handleCall = () => {
        if (!coffee?.phoneNumber) return;
        const raw = coffee.phoneNumber.replace(/\s+/g, '');
        Linking.openURL(`tel:${raw}`);
    };

    const handleOpenWebsite = () => {
        if (!coffee?.website) return;
        const url = /^https?:\/\//i.test(coffee.website) ? coffee.website : `https://${coffee.website}`;
        Linking.openURL(url);
    };

    const hoursRows = useMemo(() => {
        if (!coffee?.hours) return [] as { key: DayIndex; label: string; value: string }[];
        return DAY_ORDER.map((day) => ({
            key: day,
            label: DAY_LABELS[day],
            value: coffee.hours?.[day]?.label ?? 'Horaires non communiqués',
        }));
    }, [coffee?.hours]);

    if (!coffee) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loaderWrapper}>
                    <Text style={styles.errorText}>Ce café n'a pas pu être chargé.</Text>
                    <Pressable onPress={handleClose} style={styles.retryButton}>
                        <Text style={styles.retryLabel}>Retour</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.topBar}>
                    <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12} accessibilityRole={'button'}>
                        <SymbolView name={'xmark'} size={18} tintColor={'#1C1C1E'} />
                    </Pressable>
                </View>
                <View style={styles.heroCard}>
                    <Image
                        source={coffee.photos[0]}
                        style={styles.heroImage}
                        contentFit={'cover'}
                    />
                    <View style={styles.heroContent}>
                        <View style={styles.heroTextWrapper}>
                            <Text style={styles.heroTitle}>{coffee.name}</Text>
                            {coffee.address?.line1 ? (
                                <Text style={styles.heroSubtitle}>{coffee.address.line1}</Text>
                            ) : null}
                            <Text style={styles.heroSecondary}>
                                {[coffee.address?.postalCode, coffee.address?.city].filter(Boolean).join(' ')}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: openBackground }] }>
                            <SymbolView name={openIcon} size={16} tintColor={openColor} />
                            <Text style={[styles.statusText, { color: openColor }]}>{openText}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <FlatList
                        horizontal
                        data={coffee.photos}
                        keyExtractor={(_, index) => `${index}`}
                        renderItem={({ item }) => (
                            <Image source={item} style={styles.photoItem} contentFit={'cover'} />
                        )}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.photoList}
                        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coordonnées</Text>
                    <View style={styles.infoCard}>
                        {coffee.phoneNumber ? (
                            <Pressable style={styles.infoRow} onPress={handleCall} accessibilityRole={'button'}>
                                <View style={styles.iconCircle}>
                                    <SymbolView name={'phone.fill'} size={16} tintColor={'#1C1C1E'} />
                                </View>
                                <View style={styles.infoTextWrapper}>
                                    <Text style={styles.infoLabel}>Téléphone</Text>
                                    <Text style={styles.infoValue}>{coffee.phoneNumber}</Text>
                                </View>
                                <SymbolView name={'arrow.up.right'} size={14} tintColor={'#8E8E93'} />
                            </Pressable>
                        ) : null}
                        {coffee.website ? (
                            <Pressable style={styles.infoRow} onPress={handleOpenWebsite} accessibilityRole={'link'}>
                                <View style={styles.iconCircle}>
                                    <SymbolView name={'globe'} size={16} tintColor={'#1C1C1E'} />
                                </View>
                                <View style={styles.infoTextWrapper}>
                                    <Text style={styles.infoLabel}>Site internet</Text>
                                    <Text style={styles.infoValue} numberOfLines={1}>{coffee.website}</Text>
                                </View>
                                <SymbolView name={'arrow.up.right'} size={14} tintColor={'#8E8E93'} />
                            </Pressable>
                        ) : null}
                        <View style={styles.infoRowStatic}>
                            <View style={styles.iconCircle}>
                                <SymbolView name={'mappin.and.ellipse'} size={16} tintColor={'#1C1C1E'} />
                            </View>
                            <View style={styles.infoTextWrapper}>
                                <Text style={styles.infoLabel}>Adresse</Text>
                                {coffee.address?.line1 ? (
                                    <Text style={styles.infoValue}>{coffee.address.line1}</Text>
                                ) : null}
                                <Text style={styles.infoValue}>
                                    {[coffee.address?.postalCode, coffee.address?.city].filter(Boolean).join(' ')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Horaires</Text>
                    <View style={styles.hoursCard}>
                        <View style={styles.hoursHeader}>
                            <Text style={styles.hoursTitle}>Aujourd'hui</Text>
                            <Text style={styles.hoursValue}>{todayHoursLabel}</Text>
                        </View>
                        {hasHours ? (
                            <Pressable onPress={() => setShowAllHours((value) => !value)} style={styles.toggleHours}>
                                <Text style={styles.toggleHoursText}>
                                    {showAllHours ? 'Masquer les horaires' : 'Voir tous les horaires'}
                                </Text>
                            </Pressable>
                        ) : null}
                        {showAllHours && hasHours ? (
                            <View style={styles.hoursList}>
                                {hoursRows.map((row) => (
                                    <View key={row.key} style={styles.hoursRow}>
                                        <Text style={styles.hoursLabel}>{row.label}</Text>
                                        <Text style={styles.hoursValue}>{row.value}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 48,
    },
    loaderWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#5B5B5B',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
    },
    retryLabel: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    topBar: {
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    closeButton: {
        marginBottom:10,
        borderWidth:1,
        borderColor:palette.primary_90,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    heroCard: {
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#F6F6F6',
    },
    heroImage: {
        width: '100%',
        height: 240,
    },
    heroContent: {
        padding: 24,
        gap: 16,
    },
    heroTextWrapper: {
        gap: 6,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#6E6E73',
    },
    heroSecondary: {
        fontSize: 14,
        color: '#8E8E93',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 24,
        paddingTop: 24,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    photoList: {
        paddingVertical: 12,
    },
    photoItem: {
        width: 180,
        height: 120,
        borderRadius: 16,
        backgroundColor: '#EAEAEA',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 8,
    },
    infoRowStatic: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 8,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextWrapper: {
        flex: 1,
        gap: 2,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6B6B6B',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    infoValue: {
        fontSize: 15,
        color: '#1C1C1E',
    },
    hoursCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    hoursHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hoursTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    hoursValue: {
        fontSize: 14,
        color: '#6E6E73',
    },
    toggleHours: {
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
    },
    toggleHoursText: {
        color: '#3A3A3C',
        fontWeight: '600',
    },
    hoursList: {
        gap: 12,
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    hoursLabel: {
        fontSize: 14,
        color: '#1C1C1E',
    },
});

export default CafeDetailsScreen;
