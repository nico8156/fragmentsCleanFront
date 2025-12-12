import { v5 as uuidv5 } from "uuid";

// Namespace fixe, hard-codée dans l’app (à générer une fois)
const LIKE_NAMESPACE = "8c4aa3b4-2eaf-4b11-bc1f-7f0a6bbcd111";

export const computeLikeId = (userId: string, targetId: string): string => {
    return uuidv5(`${userId}:${targetId}`, LIKE_NAMESPACE);
};