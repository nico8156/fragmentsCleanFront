import { createAction } from "@reduxjs/toolkit";

export const createReconciled = createAction<{ commentId: string; server: { createdAt: string; version: number } }>(
    "COMMENT/CREATE_RECONCILED"
);

export const createRollback = createAction<{ tempId: string; targetId: string; parentId?: string }>(
    "COMMENT/CREATE_ROLLBACK"
);

export const updateRollback = createAction<{ commentId?: string; prevBody?: string; prevVersion?: number }>(
    "COMMENT/UPDATE_ROLLBACK"
);

export const deleteRollback = createAction<{ commentId: string; prevBody: string; prevVersion?: number; prevDeletedAt?: string }>(
    "COMMENT/DELETE_ROLLBACK"
);
