import {OpeningHours} from "@/app/contextWL/openingHoursWl/typeAction/openingHours.type";

export interface OpeningHoursGateway {
    getAllOpeningHours: () => Promise<{data : OpeningHours[] }>
}
