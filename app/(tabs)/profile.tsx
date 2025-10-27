import {
    SafeAreaView,
    ScrollView,
    Text,
    View,
    Image,
    FlatList,
    Pressable,
    StyleSheet,
    Dimensions,
    Animated
} from 'react-native';
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import React, {JSX} from 'react';


const USER = {
    id: 'u_1',
    name: 'Ava Dupont',
    handle: '@ava.coffee',
    bio: 'Barista & dev. Amateur de V60, DDD, et balades à Rennes ☕️',
    avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    banner:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    stats: { posts: 128, followers: 2340, following: 189 },
} as const;


const ACTIONS = [
    { key: 'edit', label: 'Edit', icon: (p: any) => <Ionicons name="pencil" {...p} /> },
    { key: 'share', label: 'Share', icon: (p: any) => <Ionicons name="share-outline" {...p} /> },
    { key: 'qr', label: 'QR', icon: (p: any) => <Ionicons name="qr-code-outline" {...p} /> },
] as const;


const MENU = [
    { key: 'settings', label: 'Settings', left: 'settings-outline', right: 'chevron-forward' },
    { key: 'privacy', label: 'Privacy', left: 'lock-closed-outline', right: 'chevron-forward' },
    { key: 'notifications', label: 'Notifications', left: 'notifications-outline', right: 'chevron-forward' },
    { key: 'help', label: 'Help & Support', left: 'help-circle-outline', right: 'chevron-forward' },
] as const;


const FEED = Array.from({ length: 12 }).map((_, i) => ({
    id: `p_${i}`,
// Avoid using a # marker in string titles to prevent any accidental parsing in certain bundlers
    title: `Café du jour ${i + 1}`,
    cover: `https://picsum.photos/seed/profile_${i}/600/400`,
}));
const Profile = () => {
    const HEADER_H = 220;
    const { width } = Dimensions.get('window');
    const scrollY = React.useRef(new Animated.Value(0)).current;
    const [tab, setTab] = React.useState<'Posts' | 'Badges' | 'About'>('Posts');
  return (
      <SafeAreaView style={styles.safe}>
          <AnimatedScroll
              onScroll={(e) => scrollY.setValue(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: 48 }}
          >
              <ParallaxHeader height={HEADER_H} scrollY={scrollY} image={USER.banner}>
                  <View style={styles.parallaxInfo}>
                      <Image source={{ uri: USER.avatar }} style={styles.avatarLg} />
                      <Text style={[styles.name, { color: '#fff', marginTop: 8 }]}>{USER.name}</Text>
                      <Text style={[styles.handle, { color: '#f0f0f0' }]}>{USER.handle}</Text>
                  </View>
              </ParallaxHeader>


              <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                  <View style={styles.statsRowDark}>
                      <Stat label="Posts" value={USER.stats.posts} dark />
                      <Divider vertical />
                      <Stat label="Followers" value={USER.stats.followers} dark />
                      <Divider vertical />
                      <Stat label="Following" value={USER.stats.following} dark />
                  </View>


                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Recent</Text>
                  <FlatList
                      data={FEED}
                      keyExtractor={(it) => it.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingVertical: 10 }}
                      renderItem={({ item }) => <CardPost title={item.title} cover={item.cover} width={width * 0.7} />}
                  />


                  <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', marginTop: 8 }}>
                      {MENU.map((m, idx) => (
                          <ListItem
                              key={m.key}
                              left={<Ionicons name={m.left as any} size={20} />}
                              right={<Ionicons name={m.right as any} size={18} />}
                              label={m.label}
                              divider={idx < MENU.length - 1}
                              onPress={() => {}}
                          />
                      ))}
                  </View>
              </View>
          </AnimatedScroll>
      </SafeAreaView>
  );
};

const AnimatedScroll = Animated.createAnimatedComponent(ScrollView);


function ParallaxHeader({
                            height,
                            scrollY,
                            image,
                            children,
                        }: {
    height: number;
    scrollY: Animated.Value;
    image: string;
    children?: React.ReactNode;
}) {
    const translateY = scrollY.interpolate({
        inputRange: [0, height],
        outputRange: [0, -height / 5],
        extrapolate: 'clamp',
    });
    const scale = scrollY.interpolate({
        inputRange: [-height, 0],
        outputRange: [2, 1.5],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp',
    });
    return (
        <View style={{ height, backgroundColor: '#000' }}>
            <Animated.Image
                source={{ uri: image }}
                style={{ position: 'absolute', width: '100%', height, transform: [{ translateY }, { scale }] }}
                resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 16 }}>{children}</View>
        </View>
    );
}

function formatNumber(n: number) {
    try {
        return new Intl.NumberFormat().format(n);
    } catch {
        return String(n);
    }
}



function Chip({ label, icon }: { label: string; icon?: React.ReactNode }) {
    return (
        <View style={styles.chip}>
            {icon}
            <Text style={styles.chipTxt}>{label}</Text>
        </View>
    );
}


function HeaderBanner() {
    return (
        <View style={styles.bannerWrap}>
            <Image source={{ uri: USER.banner }} style={styles.banner} />
        </View>
    );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <View style={styles.segmented}>
            {options.map((opt) => {
                const active = opt === value;
                return (
                    <Pressable key={opt} style={[styles.segment, active && styles.segmentActive]} onPress={() => onChange(opt)}>
                        <Text style={[styles.segmentTxt, active && styles.segmentTxtActive]}>{opt}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function ButtonPill({ label, icon, onPress }: { label: string; icon: (p: any) => JSX.Element; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}>
            {icon({ size: 16 })}
            <Text style={styles.pillTxt}>{label}</Text>
        </Pressable>
    );
}

function CardPost({ title, cover, width }: { title: string; cover: string; width?: number }) {
    return (
        <View style={[styles.postCard, width ? { width } : undefined]}>
            <Image source={{ uri: cover }} style={styles.postImage} />
            <Text style={styles.postTitle} numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
}

function ListItem({ left, label, right, onPress, divider }: { left?: React.ReactNode; label: string; right?: React.ReactNode; onPress?: () => void; divider?: boolean }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: '#fafafa' }]}>
            {left ? <View style={{ width: 28, alignItems: 'center' }}>{left}</View> : null}
            <Text style={styles.listLabel}>{label}</Text>
            <View style={{ flex: 1 }} />
            {right}
            {divider && <View style={styles.hairline} />}
        </Pressable>
    );
}

function Divider({ vertical }: { vertical?: boolean }) {
    return vertical ? (
        <View style={{ width: 1, height: 24, backgroundColor: '#e9e9e9' }} />
    ) : (
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />
    );
}
function Stat({ label, value, dark }: { label: string; value: number; dark?: boolean }) {
    return (
        <View style={{ alignItems: 'center', paddingHorizontal: 10 }}>
            <Text style={[styles.statValue, dark && { color: '#fff' }]}>{formatNumber(value)}</Text>
            <Text style={[styles.statLabel, dark && { color: '#e5e5e5' }]}>{label}</Text>
        </View>
    );
}
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f6f7fb' },
    container: { padding: 16 },
    segmented: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f1f5',
        borderRadius: 12,
        padding: 4,
    },
    segment: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    segmentActive: {
        backgroundColor: '#111',
    },
    segmentTxt: {
        fontWeight: '600',
        color: '#444',
    },
    segmentTxtActive: {
        color: '#fff',
    },

// Simple
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    rowTop: { flexDirection: 'row' },
    name: { fontSize: 20, fontWeight: '700', color: '#111' },
    handle: { marginTop: 2, color: '#777' },
    bio: { marginTop: 8, color: '#444' },
    avatarLg: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#ddd' },
    avatarMd: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ddd', marginRight: 12 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    statsRowDark: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingVertical: 12,
        backgroundColor: '#111',
        borderRadius: 12,
    },
    statValue: { fontSize: 16, fontWeight: '700', color: '#111' },
    statLabel: { fontSize: 12, color: '#888', marginTop: 2 },


    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#111',
        borderRadius: 999,
    },
    pillTxt: { color: '#fff', fontWeight: '600' },


    section: { marginTop: 22 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },


    postCard: { width: 220, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
    postImage: { width: '100%', height: 140, backgroundColor: '#ddd' },
    postTitle: { padding: 10, fontWeight: '600', color: '#222' },


    listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#fff' },
    listLabel: { fontSize: 15, color: '#222' },
    hairline: { position: 'absolute', left: 14, right: 14, bottom: 0, height: 1, backgroundColor: '#eee' },


// Tabs
    cardFloating: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    rowTop2: { flexDirection: 'row', alignItems: 'center' },
    followBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#111', borderRadius: 10 },
    followTxt: { color: '#fff', fontWeight: '600' },
    badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },


    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#f0f1f5',
        borderRadius: 999,
    },
    chipTxt: { color: '#333', fontWeight: '600' },


// Banner
    bannerWrap: { height: 160, backgroundColor: '#000' },
    banner: { width: '100%', height: '100%' },


// Parallax
    parallaxInfo: { alignItems: 'center', justifyContent: 'flex-end' },
});



export default Profile;