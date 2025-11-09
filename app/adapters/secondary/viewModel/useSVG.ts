import type { ComponentType } from "react";
import {
    CoffeeLogoCupSteam,
    CoffeeLogoBeanCircle,
    CoffeeLogoToGo,
    CoffeeLogoLeafCup,
    CoffeeLogoBeanRays,
    CoffeeLogoTopCup,
    CoffeeLogoRetroMug,
    CoffeeLogoBadgeBean,
    CoffeeLogoEnergy,
    CoffeeLogoPin,
} from "@/app/adapters/primary/react/features/map/components/svgs/CoffeeLogos";

type CoffeeLogoComponent = ComponentType<{ width?: number; height?: number }>;

const logos: CoffeeLogoComponent[] = [
    CoffeeLogoCupSteam,
    CoffeeLogoBeanCircle,
    CoffeeLogoToGo,
    CoffeeLogoLeafCup,
    CoffeeLogoBeanRays,
    CoffeeLogoTopCup,
    CoffeeLogoRetroMug,
    CoffeeLogoBadgeBean,
    CoffeeLogoEnergy,
    CoffeeLogoPin,
];

const useSVG = (): CoffeeLogoComponent => {
    const randomIndex = Math.floor(Math.random() * logos.length);
    return logos[randomIndex];
};

export default useSVG;
