import {CoffeeFromOldServer} from "@/assets/data/coffeeFromOldServer";
import {Address, Coffee, GeoPoint, parseToISODate} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import {ISODate} from "@/app/core-logic/contextWL/outboxWl/type/outbox.type";

export function coffeeDataConverter(coffeeData: CoffeeFromOldServer):Coffee {
    const {
        id, google_id,
        display_name,
        formatted_address,
        national_phone_number,
        website_uri,
        latitude,longitude} = coffeeData;

    const location = getLocation(latitude,longitude)
    const address = getAddress(formatted_address)
    const updatedAt =getDate()

    return {
        id,googleId:google_id,name:display_name,location,address,website:website_uri,phoneNumber:national_phone_number,version:0,updatedAt
    }

    function getAddress(Originaladdress:string):Address{
        const address = Originaladdress.trim().split(',');

        const country = address[address.length - 1];
        const cityWithPostalCode = address[address.length - 2];
        const [postalCode, city] = cityWithPostalCode.trim().split(' ');
        const line1 = address[0];
        return {
            line1, city, postalCode, country
        }
    }
    function getDate():ISODate{
        return parseToISODate(new Date().toISOString())
    }
    function getLocation(latitude:number, longitude:number):GeoPoint{
        return {
            lat:latitude,
            lon: longitude,
        }
    }

}