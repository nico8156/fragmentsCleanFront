import {CoffeeLogoCupSteam, CoffeeLogoBeanCircle, CoffeeLogoToGo,
    CoffeeLogoLeafCup, CoffeeLogoBeanRays, CoffeeLogoTopCup,
    CoffeeLogoRetroMug, CoffeeLogoBadgeBean, CoffeeLogoEnergy,
    CoffeeLogoPin} from "@/src/features/map/components/svgs/CoffeeLogos";


const useSVG = () => {
    const svg = [CoffeeLogoCupSteam, CoffeeLogoBeanCircle, CoffeeLogoToGo,
        CoffeeLogoLeafCup, CoffeeLogoBeanRays, CoffeeLogoTopCup,
        CoffeeLogoRetroMug, CoffeeLogoBadgeBean, CoffeeLogoEnergy,
        CoffeeLogoPin]
    const Element = svg[0];
    const index = svg.length
    const random = Math.floor(Math.random() * index)
    return svg[random];
};
export default useSVG;