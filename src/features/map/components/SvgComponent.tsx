import { View, Text, StyleSheet } from "react-native"
import {CoffeeLogoCupSteam, CoffeeLogoBeanCircle, CoffeeLogoToGo,
    CoffeeLogoLeafCup, CoffeeLogoBeanRays, CoffeeLogoTopCup,
    CoffeeLogoRetroMug, CoffeeLogoBadgeBean, CoffeeLogoEnergy,
    CoffeeLogoPin} from "@/src/features/map/components/svgs/CoffeeLogos"


const SvgComponent = () => {

    const random = Math.floor(Math.random() * 10);
    const names = ['coffeeLogoCupSteam', 'coffeeLogoBeanCircle', 'coffeeLogoToGo', 'coffeeLogoLeafCup', 'coffeeLogoBeanRays', 'coffeeLogoTopCup', 'coffeeLogoRetroMug', 'coffeeLogoBadgeBean', 'coffeeLogoEnergy', 'coffeeLogoPin'];
    const name = names[random];

    switch (name) {
        case 'coffeeLogoCupSteam':
            return (
                <CoffeeLogoCupSteam width={70} height={70}/>
            )
        case 'coffeeLogoBeanCircle':
            return (
                <CoffeeLogoBeanCircle width={70} height={70}/>
            )
        case 'coffeeLogoToGo':
            return (
                <CoffeeLogoToGo width={70} height={70}/>
            )
        case 'coffeeLogoLeafCup':
            return (
                <CoffeeLogoLeafCup width={70} height={70}/>
            )
        case 'coffeeLogoBeanRays':
            return (
                <CoffeeLogoBeanRays width={70} height={70}/>
            )
        case 'coffeeLogoTopCup':
            return (
                <CoffeeLogoTopCup width={70} height={70}/>
            )
        case 'coffeeLogoRetroMug':
            return (
                <CoffeeLogoRetroMug width={70} height={70}/>
            )
        case 'coffeeLogoBadgeBean':
            return (
                <CoffeeLogoBadgeBean width={70} height={70}/>
            )
        case 'coffeeLogoEnergy':
            return (
                <CoffeeLogoEnergy width={70} height={70}/>
            )
        case 'coffeeLogoPin':
            return (
                <CoffeeLogoPin width={70} height={70}/>
            )
        default:
            return (
                <Text>Default</Text>
            )
    }

}
export default SvgComponent;

const styles = StyleSheet.create({

})