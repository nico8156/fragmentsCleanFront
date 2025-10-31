import {OpeningHours} from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";

export interface OpeningHoursGateway {
    getAllOpeningHours: () => Promise<{data : OpeningHours[] }>
}
