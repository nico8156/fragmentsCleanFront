import {OpeningHoursGateway} from "@/app/core-logic/contextWL/openingHoursWl/gateway/openingHours.gateway";
import { OpeningHours } from "@/app/core-logic/contextWL/openingHoursWl/typeAction/openingHours.type";
import {openingHoursData} from "@/assets/data/openingHours";

export class FakeOpeningHoursWlGateway implements OpeningHoursGateway {
    willFail = false;
    async getAllOpeningHours () {
        if (this.willFail) {
            throw new Error('fake error from gateway')
        }
        return {data : openingHoursData as OpeningHours[]}
    }
}