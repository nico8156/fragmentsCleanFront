import {Stack, useLocalSearchParams, useRouter} from "expo-router";
import {
    FlatList,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {Image} from "expo-image";
import {SymbolView} from "expo-symbols";
import {useMemo, useState} from "react";
import {parseToCoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {useCafeFull} from "@/app/adapters/secondary/viewModel/useCafeFull";
import {useCafeOpenNow} from "@/app/adapters/secondary/viewModel/useCafeOpenNow";

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const DAY_ORDER: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export default function CoffeeDetailsScreen() {
    const {id} = useLocalSearchParams<{id?: string}>();
    const router = useRouter();

    const coffeeId = parseToCoffeeId(String(id ?? ''));
    const {coffee} = useCafeFull(coffeeId);
    const isOpen = useCafeOpenNow(coffeeId);

    const [showAllHours, setShowAllHours] = useState(false);

    const todayIndex = ((new Date().getDay() + 6) % 7) as DayIndex; // new Date().getDay() => dimanche = 0

    const todayHoursLabel = coffee?.hours?.[todayIndex]?.label ?? 'Horaires non disponibles';
    const hasHours = coffee?.hours != null;

    const openColor = isOpen ? '#34C759' : '#FF3B30';
    const openBackground = isOpen ? 'rgba(52,199,89,0.14)' : 'rgba(255,59,48,0.16)';
    const openIcon = isOpen ? 'sun.max.fill' : 'moon.zzz';
    const openText = isOpen ? 'Ouvert actuellement' : 'Actuellement fermé';

    const handleClose = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.push('/');
        }
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
        if (!coffee?.hours) return [];
        return DAY_ORDER.map((day) => ({
            key: day,
            label: DAY_LABELS[day],
            value: coffee.hours?.[day]?.label ?? 'Horaires non communiqués',
        }));
    }, [coffee?.hours]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.topBar}>
                    <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12} accessibilityRole={'button'}>
                        <SymbolView name={'xmark'} size={18} tintColor={'#1C1C1E'} />
                    </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {coffee ? (
                        <>
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
                                    <View style={[styles.statusBadge, {backgroundColor: openBackground}]}> 
                                        <SymbolView name={openIcon} size={16} tintColor={openColor} />
                                        <Text style={[styles.statusText, {color: openColor}]}>{openText}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Photos</Text>
                                <FlatList
                                    horizontal
                                    data={coffee.photos}
                                    keyExtractor={(_, index) => `${index}`}
                                    renderItem={({item}) => (
                                        <Image source={item} style={styles.photoItem} contentFit={'cover'} />
                                    )}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.photoList}
                                    ItemSeparatorComponent={() => <View style={{width: 16}} />}
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
                                <View style={styles.infoCard}>
                                    <Pressable
                                        style={styles.hoursSummary}
                                        onPress={() => hasHours && setShowAllHours((prev) => !prev)}
                                        disabled={!hasHours}
                                        accessibilityRole={'button'}
                                    >
                                        <View style={styles.hoursSummaryLeft}>
                                            <View style={styles.iconCircle}>
                                                <SymbolView name={'clock.fill'} size={16} tintColor={'#1C1C1E'} />
                                            </View>
                                            <Text style={styles.infoLabel}>Aujourd’hui</Text>
                                        </View>
                                        <View style={styles.hoursSummaryRight}>
                                            <Text style={styles.hoursValue}>{todayHoursLabel}</Text>
                                            {hasHours ? (
                                                <SymbolView
                                                    name={'chevron.down'}
                                                    size={14}
                                                    tintColor={'#8E8E93'}
                                                    style={{transform: [{rotate: showAllHours ? '180deg' : '0deg'}]}}
                                                />
                                            ) : null}
                                        </View>
                                    </Pressable>
                                    {showAllHours && hoursRows.length ? (
                                        <View style={styles.hoursList}>
                                            {hoursRows.map((row) => (
                                                <View
                                                    key={row.key}
                                                    style={[
                                                        styles.hoursRow,
                                                        row.key === todayIndex && styles.hoursRowToday,
                                                    ]}
                                                >
                                                    <Text style={[styles.hoursDay, row.key === todayIndex && styles.hoursDayToday]}>
                                                        {row.label}
                                                    </Text>
                                                    <Text
                                                        style={[styles.hoursValue, row.key === todayIndex && styles.hoursValueToday]}
                                                    >
                                                        {row.value}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>Café introuvable</Text>
                            <Text style={styles.emptySubtitle}>
                                Impossible de charger les informations demandées. Retournez à la carte pour sélectionner un autre lieu.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    topBar: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 4,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        gap: 24,
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 5,
    },
    heroImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#E5E5EA',
    },
    heroContent: {
        padding: 20,
        gap: 16,
    },
    heroTextWrapper: {
        gap: 6,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#6E6E73',
    },
    heroSecondary: {
        fontSize: 14,
        color: '#8E8E93',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    photoList: {
        paddingVertical: 4,
    },
    photoItem: {
        width: 220,
        height: 160,
        borderRadius: 18,
        backgroundColor: '#E5E5EA',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 10,
        gap: 4,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.12)',
    },
    infoRowStatic: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextWrapper: {
        flex: 1,
        gap: 4,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        color: '#1C1C1E',
    },
    hoursSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(60,60,67,0.12)',
    },
    hoursSummaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hoursSummaryRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    hoursValue: {
        fontSize: 15,
        color: '#1C1C1E',
    },
    hoursList: {
        marginTop: 4,
        gap: 8,
    },
    hoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
    },
    hoursDay: {
        fontSize: 15,
        color: '#3A3A3C',
        width: 110,
    },
    hoursValueToday: {
        fontWeight: '600',
        color: '#1C1C1E',
    },
    hoursDayToday: {
        fontWeight: '600',
        color: '#1C1C1E',
    },
    hoursRowToday: {
        backgroundColor: 'rgba(10,132,255,0.08)',
    },
    emptyState: {
        marginTop: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#3A3A3C',
        textAlign: 'center',
        lineHeight: 22,
    },
});
