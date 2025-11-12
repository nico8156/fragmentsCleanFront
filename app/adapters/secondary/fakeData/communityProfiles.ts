export type CommunityProfile = {
    id: string;
    displayName: string;
    avatarUrl: string;
    email: string;
    bio?: string;
};

const DEFAULT_UNSPLASH_AVATAR =
    "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687";

export const COMMUNITY_PROFILES: Record<string, CommunityProfile> = {
    "camille.dupont": {
        id: "camille.dupont",
        displayName: "Camille \"Flat White\" Dupont",
        avatarUrl: DEFAULT_UNSPLASH_AVATAR,
        email: "camille.dupont@example.com",
        bio: "Toujours partante pour découvrir un nouveau torréfacteur artisanal.",
    },
    "yanis.benali": {
        id: "yanis.benali",
        displayName: "Yanis \"Roastery\" Benali",
        avatarUrl: "https://i.pravatar.cc/120?u=yanis.benali",
        email: "yanis.benali@example.com",
        bio: "Barista amateur, obsédé par les extractions parfaites.",
    },
    "sophie.nguyen": {
        id: "sophie.nguyen",
        displayName: "Sophie \"Latte Art\" Nguyen",
        avatarUrl: "https://i.pravatar.cc/120?u=sophie.nguyen",
        email: "sophie.nguyen@example.com",
        bio: "Collectionne les mugs et les cappuccinos crémeux.",
    },
    "louis.martel": {
        id: "louis.martel",
        displayName: "Louis \"V60\" Martel",
        avatarUrl: "https://i.pravatar.cc/120?u=louis.martel",
        email: "louis.martel@example.com",
        bio: "Ne jure que par les filtres et les cafés de spécialité.",
    },
    "anais.morel": {
        id: "anais.morel",
        displayName: "Anaïs \"Mocha\" Morel",
        avatarUrl: "https://i.pravatar.cc/120?u=anais.morel",
        email: "anais.morel@example.com",
        bio: "Toujours à la recherche du dessert parfait pour accompagner son espresso.",
    },
};

export const DEFAULT_COMMUNITY_PROFILE = COMMUNITY_PROFILES["camille.dupont"];

export const COMMUNITY_PROFILE_LIST = Object.values(COMMUNITY_PROFILES);

export const getCommunityProfile = (id: string): CommunityProfile | undefined => COMMUNITY_PROFILES[id];

export const getProfileOrDefault = (id: string): CommunityProfile =>
    getCommunityProfile(id) ?? DEFAULT_COMMUNITY_PROFILE;
