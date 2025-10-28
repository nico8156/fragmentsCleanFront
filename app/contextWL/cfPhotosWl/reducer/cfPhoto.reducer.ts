import {createReducer} from "@reduxjs/toolkit";
import {AppStateWl} from "@/app/store/appStateWl";
import { photosHydrated} from "@/app/contextWL/cfPhotosWl/typeAction/cfPhoto.action";

const initialState :AppStateWl["cfPhotos"]= {
    byCoffeeId:{}
}

export const cfPhotoReducer = createReducer(
    initialState,
    (builder) => {
        builder
            .addCase(photosHydrated,(state,action) => {
                const photos = action.payload.photos;
                photos.forEach(p => {
                    const cafeId = p.coffee_id;
                    if(!state.byCoffeeId[cafeId]){
                        state.byCoffeeId[cafeId] = []
                    }
                    if(!state.byCoffeeId[cafeId].includes(p.photo_uri)){
                        state.byCoffeeId[cafeId].push(p.photo_uri)
                    }
                })
            })
    }
)