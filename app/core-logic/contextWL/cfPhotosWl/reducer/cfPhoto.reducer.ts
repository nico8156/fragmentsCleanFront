import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import { photosHydrated} from "@/app/core-logic/contextWL/cfPhotosWl/typeAction/cfPhoto.action";
import { readModelCacheRehydrated } from "@/app/core-logic/contextWL/appWl/typeAction/readModelCache.action";

const initialState :AppStateWl["cfPhotos"]= {
    byCoffeeId:{}
}

const buildByCoffeeId = (photos: { coffee_id: string; photo_uri: string }[]) => {
    const byCoffeeId: Record<string, string[]> = {};

    photos.forEach((photo) => {
        const coffeeId = photo.coffee_id;
        if (!byCoffeeId[coffeeId]) {
            byCoffeeId[coffeeId] = [];
        }
        if (!byCoffeeId[coffeeId].includes(photo.photo_uri)) {
            byCoffeeId[coffeeId].push(photo.photo_uri);
        }
    });

    return byCoffeeId;
};

export const cfPhotoReducer = createReducer(
    initialState,
    (builder) => {
        builder
	            .addCase(photosHydrated,(state,action) => {
	                state.byCoffeeId = buildByCoffeeId(action.payload.photos);
	            })
	            .addCase(readModelCacheRehydrated, (_state, { payload }) => {
	                if (!payload.cfPhotos) return;
	                return payload.cfPhotos;
	            })
	    }
	)
