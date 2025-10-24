

import {CommentEntity, ModerationType, moderationTypes} from "@/app/contextWL/commentWl/type/commentWl.type";

export type ISODate = string;
export type UserId = string;


// ------------------------------------------------------
// Petit PRNG déterministe (no dep)
function lcg(seed = 42) {
    let s = seed >>> 0;
    return () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
}
const randInt = (r: () => number, min: number, max: number) =>
    Math.floor(r() * (max - min + 1)) + min;
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const chance = (r: () => number, p: number) => r() < p;

// Helpers
function randomDateWithinDays(r: () => number, daysBack = 30): ISODate {
    const now = Date.now();
    const delta = randInt(r, 0, daysBack * 24 * 60 * 60 * 1000);
    return new Date(now - delta).toISOString();
}
function uuidLike(r: () => number): string {
    const hex = "0123456789abcdef";
    const part = (len: number) =>
        Array.from({ length: len }, () => hex[Math.floor(r() * 16)]).join("");
    return `${part(8)}-${part(4)}-${part(4)}-${part(4)}-${part(12)}`;
}

// ------------------------------------------------------
// Corpus léger pour des bodies plausibles
const sentences = [
    "Excellent espresso, crema au top.",
    "Latte un peu trop chaud, mais ambiance parfaite.",
    "Service hyper sympa, je reviens !",
    "Filtre propre, notes florales bien présentes.",
    "Trop de bruit aux heures de pointe.",
    "Boulangerie partenaire au top pour les viennoiseries.",
    "Wifi correct, prises disponibles.",
    "Moulu un peu trop fin ce matin.",
    "Belle sélection de cafés de spécialité.",
    "Le barista m’a conseillé une V60, super !",
];

const modPool: ModerationType[] = [moderationTypes.PUBLISHED,moderationTypes.PENDING,moderationTypes.REJECTED,moderationTypes.SOFT_DELETED];

// ------------------------------------------------------
// Générateur principal
export type GenerateOptions = {
    count: number;                   // nb total de commentaires (top-level + replies)
    targetIds: string[];             // ex: ids de cafés ou posts
    userIds: string[];               // auteurs possibles
    seed?: number;                   // pour des datasets stables
    maxDaysBack?: number;            // fenêtre temporelle
    replyShare?: number;             // part de replies (0..1)
    deletionShare?: number;          // probabilité de deleted
    editShare?: number;              // probabilité d'edited
    optimisticShare?: number;        // probabilité d'optimistic
};

export function generateFakeComments(opts: GenerateOptions): CommentEntity[] {
    const {
        count,
        targetIds,
        userIds,
        seed = 1337,
        maxDaysBack = 30,
        replyShare = 0.35,
        deletionShare = 0.05,
        editShare = 0.2,
        optimisticShare = 0.08,
    } = opts;

    const r = lcg(seed);
    const comments: CommentEntity[] = [];
    const topLevelIds: string[] = [];

    // 1) Créer des top-level d'abord (environ (1 - replyShare) * count)
    const targetTopCount = Math.max(1, Math.round(count * (1 - replyShare)));

    for (let i = 0; i < targetTopCount; i++) {
        const id = uuidLike(r);
        const createdAt = randomDateWithinDays(r, maxDaysBack);
        const edited = chance(r, editShare);
        const deleted = !edited && chance(r, deletionShare); // éviter edited + deleted simultané (ajuste si besoin)

        const entity: CommentEntity = {
            id,
            targetId: pick(r, targetIds),
            body: pick(r, sentences),
            authorId: pick(r, userIds),
            createdAt,
            editedAt: edited ? new Date(new Date(createdAt).getTime() + randInt(r, 60_000, 86_400_000)).toISOString() : undefined,
            deletedAt: deleted ? new Date(new Date(createdAt).getTime() + randInt(r, 30_000, 3600_000)).toISOString() : undefined,
            likeCount: randInt(r, 0, 48),
            replyCount: 0, // on calculera après
            moderation: pick(r, modPool),
            version: edited ? 2 : 1,
            optimistic: chance(r, optimisticShare) || undefined,
        };
        comments.push(entity);
        topLevelIds.push(id);
    }

    // 2) Générer des replies (le reste)
    const remaining = Math.max(0, count - comments.length);
    for (let i = 0; i < remaining; i++) {
        // parent = top-level ou déjà une reply → ok pour threads >1 niveau
        const possibleParents = comments.map(c => c.id);
        const parentId = pick(r, possibleParents);
        const parent = comments.find(c => c.id === parentId)!;

        // Replies héritent du même targetId que leur parent
        const createdAt = randomDateWithinDays(r, maxDaysBack);
        const edited = chance(r, editShare);
        const deleted = !edited && chance(r, deletionShare);

        const reply: CommentEntity = {
            id: uuidLike(r),
            targetId: parent.targetId,
            parentId: parentId,
            body: "↳ " + pick(r, sentences),
            authorId: pick(r, userIds),
            createdAt,
            editedAt: edited ? new Date(new Date(createdAt).getTime() + randInt(r, 30_000, 86_400_000)).toISOString() : undefined,
            deletedAt: deleted ? new Date(new Date(createdAt).getTime() + randInt(r, 15_000, 3600_000)).toISOString() : undefined,
            likeCount: randInt(r, 0, 24),
            replyCount: 0,
            moderation: pick(r, modPool),
            version: edited ? 2 : 1,
            optimistic: chance(r, optimisticShare) || undefined,
        };
        comments.push(reply);
    }

    // 3) Recalculer les replyCount par parent
    const replyCountById = new Map<string, number>();
    for (const c of comments) {
        if (c.parentId) {
            replyCountById.set(c.parentId, (replyCountById.get(c.parentId) ?? 0) + 1);
        }
    }
    for (const c of comments) {
        c.replyCount = replyCountById.get(c.id) ?? 0;
    }

    // 4) Option UX : si deletedAt présent, body minimal (selon ta politique)
    for (const c of comments) {
        if (c.deletedAt) {
            c.body = "(commentaire supprimé)";
        }
    }

    // 5) Tri chrono ascendant (ou inverse si tu préfères)
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return comments;
}

// ------------------------------------------------------
// Exemple d’usage rapide (supprime si tu n’en veux pas dans le bundle)
// if (__DEV__) {
//     const demo = generateFakeComments({
//         count: 40,
//         targetIds: ["cafe:breizh-1", "cafe:kitsune-2", "cafe:obscura-3"],
//         userIds: ["u:anne", "u:bruno", "u:chloe", "u:dylan", "u:emma"],
//         seed: 20251024,
//     });
    // console.log(demo.slice(0, 5));
//}
// testComments.ts
// Jeu de données déterministe : 20 CommentEntity
// Hypothèses : ModerationType accepte "approved" | "pending" | "rejected" | "shadow"
// Si tes littéraux diffèrent, remplace-les facilement ci-dessous.

// testComments.ts
// Jeu de données déterministe : 20 CommentEntity
// Hypothèses : ModerationType accepte "approved" | "pending" | "rejected" | "shadow"
// Si tes littéraux diffèrent, remplace-les facilement ci-dessous.

export const testComments: CommentEntity[] = [
    // Top-level (cafe:lomi)
    {
        id: "c-001",
        targetId: "cafe:lomi",
        body: "Excellent espresso, crema au top.",
        authorId: "u:anne",
        createdAt: "2025-10-01T09:00:00.000Z",
        likeCount: 12,
        replyCount: 2,
        moderation: moderationTypes.PENDING,
        version: 1,
    },
    {
        id: "c-002",
        targetId: "cafe:lomi",
        body: "Latte un peu trop chaud, mais ambiance parfaite.",
        authorId: "u:bruno",
        createdAt: "2025-10-01T10:00:00.000Z",
        editedAt: "2025-10-01T12:30:00.000Z",
        likeCount: 5,
        replyCount: 1,
        moderation: moderationTypes.PUBLISHED,
        version: 2,
    },

    // Top-level (cafe:kitsune)
    {
        id: "c-003",
        targetId: "cafe:kitsune",
        body: "Filtre propre, notes florales bien présentes.",
        authorId: "u:chloe",
        createdAt: "2025-10-01T11:00:00.000Z",
        likeCount: 8,
        replyCount: 3,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Top-level (cafe:obscura)
    {
        id: "c-004",
        targetId: "cafe:obscura",
        body: "Trop de bruit aux heures de pointe.",
        authorId: "u:dylan",
        createdAt: "2025-10-01T12:00:00.000Z",
        likeCount: 3,
        replyCount: 1,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Replies to c-001
    {
        id: "c-005",
        targetId: "cafe:lomi",
        parentId: "c-001",
        body: "↳ Entièrement d’accord, extraction nickel ce matin.",
        authorId: "u:emma",
        createdAt: "2025-10-01T13:00:00.000Z",
        likeCount: 2,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    {
        id: "c-006",
        targetId: "cafe:lomi",
        parentId: "c-001",
        body: "↳ Le moulin était réglé plus fin, ça se sentait.",
        authorId: "u:bruno",
        createdAt: "2025-10-01T13:10:00.000Z",
        likeCount: 1,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Reply to c-002
    {
        id: "c-007",
        targetId: "cafe:lomi",
        parentId: "c-002",
        body: "↳ Yes, mais l’équipe est super réactive.",
        authorId: "u:anne",
        createdAt: "2025-10-01T13:20:00.000Z",
        likeCount: 0,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Replies to c-003
    {
        id: "c-008",
        targetId: "cafe:kitsune",
        parentId: "c-003",
        body: "↳ Gouttes de jasmin très nettes sur la V60.",
        authorId: "u:dylan",
        createdAt: "2025-10-01T13:30:00.000Z",
        likeCount: 4,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    {
        id: "c-009",
        targetId: "cafe:kitsune",
        parentId: "c-003",
        body: "↳ (commentaire supprimé)",
        authorId: "u:emma",
        createdAt: "2025-10-01T13:40:00.000Z",
        deletedAt: "2025-10-01T14:00:00.000Z",
        likeCount: 0,
        replyCount: 0,
        moderation: moderationTypes.SOFT_DELETED,
        version: 1,
    },
    {
        id: "c-010",
        targetId: "cafe:kitsune",
        parentId: "c-003",
        body: "↳ Belle longueur en bouche.",
        authorId: "u:bruno",
        createdAt: "2025-10-01T13:50:00.000Z",
        likeCount: 1,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Reply to c-004
    {
        id: "c-011",
        targetId: "cafe:obscura",
        parentId: "c-004",
        body: "↳ Tip: évite 12h–14h, c’est plus calme après.",
        authorId: "u:chloe",
        createdAt: "2025-10-01T14:00:00.000Z",
        likeCount: 6,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Another top-level (cafe:lomi)
    {
        id: "c-012",
        targetId: "cafe:lomi",
        body: "Wifi correct, prises disponibles.",
        authorId: "u:emma",
        createdAt: "2025-10-02T09:00:00.000Z",
        likeCount: 9,
        replyCount: 3,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    // Replies to c-012
    {
        id: "c-013",
        targetId: "cafe:lomi",
        parentId: "c-012",
        body: "↳ Parfait pour bosser une heure.",
        authorId: "u:anne",
        createdAt: "2025-10-02T09:10:00.000Z",
        likeCount: 2,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    {
        id: "c-014",
        targetId: "cafe:lomi",
        parentId: "c-012",
        body: "↳ Les tables près de la fenêtre sont top.",
        authorId: "u:chloe",
        createdAt: "2025-10-02T09:20:00.000Z",
        likeCount: 1,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    {
        id: "c-015",
        targetId: "cafe:lomi",
        parentId: "c-012",
        body: "↳ Éclairage un peu dur en fin de journée.",
        authorId: "u:dylan",
        createdAt: "2025-10-02T09:30:00.000Z",
        likeCount: 0,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Another top-level (cafe:kitsune)
    {
        id: "c-016",
        targetId: "cafe:kitsune",
        body: "Le barista m’a conseillé une V60, super !",
        authorId: "u:bruno",
        createdAt: "2025-10-02T10:00:00.000Z",
        likeCount: 7,
        replyCount: 2,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    // Replies to c-016
    {
        id: "c-017",
        targetId: "cafe:kitsune",
        parentId: "c-016",
        body: "↳ Quelle origine ?",
        authorId: "u:emma",
        createdAt: "2025-10-02T10:10:00.000Z",
        likeCount: 0,
        replyCount: 0,
        moderation: moderationTypes.PENDING,
        version: 1,
    },
    {
        id: "c-018",
        targetId: "cafe:kitsune",
        parentId: "c-016",
        body: "↳ Probablement un éthiopien lavé.",
        authorId: "u:anne",
        createdAt: "2025-10-02T10:20:00.000Z",
        likeCount: 3,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },

    // Another top-level (cafe:obscura)
    {
        id: "c-019",
        targetId: "cafe:obscura",
        body: "Belle sélection de cafés de spécialité.",
        authorId: "u:chloe",
        createdAt: "2025-10-02T11:00:00.000Z",
        likeCount: 11,
        replyCount: 1,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
    // Reply to c-019
    {
        id: "c-020",
        targetId: "cafe:obscura",
        parentId: "c-019",
        body: "↳ Les moulins sont bien calibrés.",
        authorId: "u:dylan",
        createdAt: "2025-10-02T11:10:00.000Z",
        likeCount: 1,
        replyCount: 0,
        moderation: moderationTypes.PUBLISHED,
        version: 1,
    },
];
