import {Image, Pressable, StyleSheet, Text, View} from "react-native";
import { useCallback } from "react";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { useAuthUser } from "@/app/adapters/secondary/viewModel/useAuthUser";
import {SymbolView} from "expo-symbols";
import SvgComponent from "@/app/adapters/primary/react/features/map/components/SvgComponent";
import {SFSymbols6_0} from "sf-symbols-typescript";

const data : {
    symbolName:SFSymbols6_0,
    title:string,
    page:string
}[] = [
    {
        symbolName:"pencil",
        title:"Edit Profile",
        page:"EditProfileScreen"
    },
    {
        symbolName:"list.bullet.rectangle.portrait",
        title:"Tickets",
        page:"TicketsScreen"
    },
    {
        symbolName:"heart.fill",
        title:"Favorites",
        page:"FavoritesScreen"
    },
    {
        symbolName:"dial.low",
        title:"Settings",
        page:"AppSettingScreen"
    },
]

export function ProfileScreen() {
    const {
        displayName,
        primaryEmail,
        avatarUrl,
        bio,
        isSignedIn,
        isLoading,
        hasError,
        signOut: signOutUser,
    } = useAuthUser();

    const statusLabel = isSignedIn ? "Connecté" : isLoading ? "Chargement..." : hasError ? "Erreur" : "Hors connexion";
    const emailLabel = primaryEmail ?? "Non renseigné";

    const handleSignOut = useCallback(() => {
        if (!isSignedIn) {
            return;
        }
        signOutUser();
    }, [isSignedIn, signOutUser]);

    const handlePress = useCallback((page:string)=>{
        //TODO navigate to relevant screen
        console.log(page)
    }, [])

    return (
        <View style={{flex:1, backgroundColor:palette.bg_dark_90}}>
                <View style={styles.masterHeader}>
                    <Text style={styles.title}>PROFILE</Text>
                </View>
                <View style={styles.profile}>
                    <Image source={{ uri: avatarUrl }} style={{width:150, height:150, borderRadius:75}}/>
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Text style={styles.profileEmail}>{emailLabel}</Text>
                </View>
                <View style={{flexDirection:"row",justifyContent:"center", alignItems:"center", gap:20}}>
                    <SvgComponent coffeeId={undefined} width={80} height={80}/>
                    <Text style={{color:palette.primary_90, fontWeight:"bold"}}>Coffee Lover</Text>
                </View>
                <View style={styles.menu}>
                    {data.map((item,index)=>(
                        <Pressable key={index}  onPress={()=>handlePress(item.page)}>
                            <View style={styles.selector}>
                                <SymbolView name={item.symbolName as SFSymbols6_0} size={24} weight={"bold"} tintColor={palette.textPrimary}/>
                                <Text style={styles.selectorTitle}>{item.title}</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>

            {/*<ScrollView contentContainerStyle={styles.container}>*/}
            {/*    <View style={styles.header}>*/}
            {/*        <View style={styles.avatar}>*/}
            {/*            {avatarUrl ? (*/}
            {/*                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />*/}
            {/*            ) : (*/}
            {/*                <Text style={styles.avatarInitial}>{displayName?.[0]?.toUpperCase() ?? "F"}</Text>*/}
            {/*            )}*/}
            {/*        </View>*/}
            {/*        <Text style={styles.name}>{displayName}</Text>*/}
            {/*        <Text style={styles.email}>{emailLabel}</Text>*/}
            {/*        {bio ? <Text style={styles.bio}>{bio}</Text> : null}*/}
            {/*    </View>*/}
            {/*    <View style={styles.card}>*/}
            {/*        <Text style={styles.cardTitle}>Compte</Text>*/}
            {/*        <Text style={styles.cardSubtitle}>*/}
            {/*            Gère tes préférences, ta sécurité et l’accès à tes cafés favoris.*/}
            {/*        </Text>*/}
            {/*        <View style={styles.row}>*/}
            {/*            <View>*/}
            {/*                <Text style={styles.rowTitle}>Statut</Text>*/}
            {/*                <Text style={styles.rowSubtitle}>{statusLabel}</Text>*/}
            {/*            </View>*/}
            {/*        </View>*/}
            {/*    </View>*/}
            {/*    <Pressable*/}
            {/*        style={({ pressed }) => [*/}
            {/*            styles.signOutButton,*/}
            {/*            pressed && !isLoading && styles.signOutButtonPressed,*/}
            {/*            (isLoading || !isSignedIn) && styles.signOutButtonDisabled,*/}
            {/*        ]}*/}
            {/*        disabled={isLoading || !isSignedIn}*/}
            {/*        onPress={handleSignOut}*/}
            {/*    >*/}
            {/*        <Text style={styles.signOutLabel}>Se déconnecter</Text>*/}
            {/*    </Pressable>*/}
            {/*</ScrollView>*/}
        </View>
    );
}

const styles = StyleSheet.create({
    masterHeader:{
        backgroundColor: palette.primary_50,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom:12,
        paddingTop:45,
    },
    title:{
      fontSize: 32,
        fontWeight: "700",
        color: palette.text_90,
    },
    profile:{
        alignItems: "center",
        paddingVertical: 20,
        gap:10
    },
    profileName:{
        fontSize: 28,
        fontWeight: "600",
        color: palette.text_90,
    },
    profileEmail:{
        fontSize: 20,
        fontWeight: "400",
        color: palette.text_90,
    },
    menu:{
        flex:1,
        justifyContent:"center",
        backgroundColor:palette.bg_dark_30,
        borderRadius:12,
        padding:20,
        gap:10,
    },
    selector:{
        backgroundColor:palette.bg_dark_10,
        flexDirection:"row",
        gap:20,
        borderWidth:1,
        borderColor:palette.border,
        borderRadius:16,
        paddingHorizontal:20,
        paddingVertical:14,
    },
    selectorTitle:{
        fontSize: 24,
        fontWeight: "400",
        color: palette.text_90,
    },
    safeArea: {
        flex: 1,
        backgroundColor: palette.background,
    },
    container: {
        padding: 28,
        gap: 28,
    },
    header: {
        gap: 12,
        alignItems: "center",
    },
    name: {
        fontSize: 26,
        fontWeight: "700",
        color: palette.textPrimary,
    },
    email: {
        fontSize: 14,
        color: palette.textMuted,
    },
    bio: {
        fontSize: 14,
        color: palette.textSecondary,
        textAlign: "center",
    },
    card: {
        backgroundColor: palette.elevated,
        borderRadius: 28,
        padding: 24,
        gap: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: palette.textSecondary,
        lineHeight: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: palette.textPrimary,
    },
    rowSubtitle: {
        fontSize: 14,
        color: palette.textMuted,
    },
    signOutButton: {
        backgroundColor: palette.accent,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
    },
    signOutButtonPressed: {
        opacity: 0.8,
    },
    signOutButtonDisabled: {
        opacity: 0.5,
    },
    signOutLabel: {
        color: "#1C0E08",
        fontSize: 16,
        fontWeight: "600",
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: palette.overlay,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
        overflow: "hidden",
    },
    avatarInitial: {
        fontSize: 32,
        fontWeight: "700",
        color: palette.textPrimary,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
});

export default ProfileScreen;
