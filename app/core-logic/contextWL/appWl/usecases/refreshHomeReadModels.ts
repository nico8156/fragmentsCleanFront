import { articlesListRetrieval } from "@/app/core-logic/contextWL/articleWl/usecases/read/articleRetrieval";
import { coffeeGlobalRetrieval } from "@/app/core-logic/contextWL/coffeeWl/usecases/read/coffeeRetrieval";
import { onCfPhotoRetrieval } from "@/app/core-logic/contextWL/cfPhotosWl/usecases/read/oncfPhotoRetrieval";
import { onOpeningHourRetrieval } from "@/app/core-logic/contextWL/openingHoursWl/usecases/read/openingHourRetrieval";
import { myExperiencesRetrieval } from "@/app/core-logic/contextWL/experienceWl/usecases/read/experienceRetrieval";
import { entitlementsRetrieval } from "@/app/core-logic/contextWL/entitlementWl/usecases/read/entitlementRetrieval";
import type { AppDispatchWl } from "@/app/store/reduxStoreWl";

/** Refresh public projections through their owning read use cases, never from SSE bodies. */
export async function refreshHomeReadModels(dispatch: AppDispatchWl, userId?: string): Promise<void> {
    const reads = [
		Promise.resolve(dispatch(coffeeGlobalRetrieval() as any)),
		Promise.resolve(dispatch(onCfPhotoRetrieval() as any)),
		Promise.resolve(dispatch(onOpeningHourRetrieval() as any)),
		Promise.resolve(dispatch(articlesListRetrieval({ locale: "fr-FR" }) as any)),
    ];
    if (userId) {
        reads.push(Promise.resolve(dispatch(myExperiencesRetrieval() as any)));
        reads.push(Promise.resolve(dispatch(entitlementsRetrieval({ userId }) as any)));
    }
    await Promise.allSettled(reads);
}
