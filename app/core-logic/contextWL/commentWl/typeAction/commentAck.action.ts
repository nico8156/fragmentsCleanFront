import { createAction } from "@reduxjs/toolkit";

type ISODate = string;

export const createConfirmed = createAction<{
	commentId: string;
	targetId: string;
	server: { createdAt: ISODate; version: number };
}>("COMMENT/CREATE_CONFIRMED");

export const updateReconciled = createAction<{
	commentId: string;
	server: { editedAt: ISODate; version: number; body?: string };
}>("COMMENT/UPDATE_RECONCILED");

export const deleteReconciled = createAction<{
	commentId: string;
	server: { deletedAt: ISODate; version: number };
}>("COMMENT/DELETE_RECONCILED");

