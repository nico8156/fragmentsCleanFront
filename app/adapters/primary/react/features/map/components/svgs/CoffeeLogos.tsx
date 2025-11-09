// CoffeeLogos.tsx
import React from "react";
import Svg, {
    Rect,
    Path,
    Circle,
    Ellipse,
    SvgProps,
} from "react-native-svg";

/**
 * 1. Tasse minimaliste avec vapeur
 */
export const CoffeeLogoCupSteam = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={12} fill="#F4EDE6" />
        <Path
            d="M18 26h20a4 4 0 0 1 4 4v8a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8v-8a4 4 0 0 1 4-4z"
            fill="#FFFFFF"
            stroke="#2B211A"
            strokeWidth={2}
        />
        <Path
            d="M38 28h3a5 5 0 0 1 0 10h-3"
            fill="none"
            stroke="#2B211A"
            strokeWidth={2}
        />
        <Path
            d="M26 18c0 2-2 3-2 5"
            fill="none"
            stroke="#C49A6C"
            strokeWidth={2}
            strokeLinecap="round"
        />
        <Path
            d="M32 18c0 2-2 3-2 5"
            fill="none"
            stroke="#C49A6C"
            strokeWidth={2}
            strokeLinecap="round"
        />
        <Path
            d="M20 40h16"
            stroke="#E2D2C0"
            strokeWidth={2}
            strokeLinecap="round"
        />
    </Svg>
);

/**
 * 2. Grain de café stylisé circulaire
 */
export const CoffeeLogoBeanCircle = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={32} fill="#2B211A" />
        <Ellipse cx={32} cy={32} rx={14} ry={20} fill="#C49A6C" />
        <Path
            d="M30 14c-4 6-4 16 0 22 2 4 5 6 8 7"
            fill="none"
            stroke="#2B211A"
            strokeWidth={2}
            strokeLinecap="round"
        />
    </Svg>
);

/**
 * 3. Gobelet à emporter
 */
export const CoffeeLogoToGo = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={10} fill="#F4EDE6" />
        <Path d="M22 16h20l-2 6H24l-2-6z" fill="#2B211A" />
        <Path
            d="M24 22h16l-3 22a4 4 0 0 1-4 3h-2a4 4 0 0 1-4-3l-3-22z"
            fill="#FFFFFF"
            stroke="#2B211A"
            strokeWidth={2}
        />
        <Rect x={24} y={28} width={16} height={8} rx={4} fill="#C49A6C" opacity={0.85} />
    </Svg>
);

/**
 * 4. Tasse + feuille (café & nature)
 */
export const CoffeeLogoLeafCup = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={16} fill="#2B211A" />
        <Path
            d="M18 28h18a4 4 0 0 1 4 4v5a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8v-5a4 4 0 0 1 4-4z"
            fill="#FFFFFF"
            stroke="#F4EDE6"
            strokeWidth={2}
        />
        <Path
            d="M36 30h3a4 4 0 0 1 0 8h-3"
            fill="none"
            stroke="#F4EDE6"
            strokeWidth={2}
        />
        <Path
            d="M40 19c4 0 7 2 9 5-1 3-4 5-7 6-3 0-5-2-6-4 1-3 2-6 4-7z"
            fill="#C9E4C5"
        />
        <Path
            d="M41 20c0 3-1 7-3 9"
            stroke="#4F8A4D"
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);

/**
 * 5. Bean & Rays
 */
export const CoffeeLogoBeanRays = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={12} fill="#2B211A" />
        <Circle cx={32} cy={32} r={18} fill="#F4EDE6" />
        <Ellipse cx={32} cy={32} rx={7} ry={11} fill="#C49A6C" />
        <Path
            d="M30 23c-3 5-3 11 0 16 1.5 2 3 3 4.5 3.5"
            fill="none"
            stroke="#2B211A"
            strokeWidth={1.5}
            strokeLinecap="round"
        />
        <Path
            d="M32 10v6M32 48v6M16 32h6M42 32h6M21 21l4 4M39 39l4 4M21 43l4-4M39 25l4-4"
            stroke="#C49A6C"
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);

/**
 * 6. Vue de dessus (latte art)
 */
export const CoffeeLogoTopCup = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={16} fill="#F4EDE6" />
        <Circle cx={30} cy={32} r={16} fill="#2B211A" />
        <Circle cx={30} cy={32} r={11} fill="#C49A6C" />
        <Path
            d="M22 32c2-3 4-4 8-4s6 1 8 4c-2 3-4 4-8 4s-6-1-8-4z"
            fill="none"
            stroke="#F4EDE6"
            strokeWidth={1.8}
            strokeLinecap="round"
        />
        <Path
            d="M38 26h4a6 6 0 0 1 0 12h-4"
            fill="none"
            stroke="#2B211A"
            strokeWidth={2}
        />
    </Svg>
);

/**
 * 7. Mug rétro avec bande
 */
export const CoffeeLogoRetroMug = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={10} fill="#2B211A" />
        <Rect
            x={14}
            y={20}
            width={24}
            height={20}
            rx={4}
            fill="#FFFFFF"
            stroke="#F4EDE6"
            strokeWidth={2}
        />
        <Rect x={16} y={26} width={20} height={4} rx={2} fill="#C49A6C" />
        <Path
            d="M38 22h3a6 6 0 0 1 0 12h-3"
            fill="none"
            stroke="#F4EDE6"
            strokeWidth={2}
        />
        <Path
            d="M22 14c0 2-2 3-2 5M28 14c0 2-2 3-2 5"
            fill="none"
            stroke="#C49A6C"
            strokeWidth={2}
            strokeLinecap="round"
        />
    </Svg>
);

/**
 * 8. Coffee Pin (localisation)
 */
export const CoffeeLogoPin = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={16} fill="#F4EDE6" />
        <Path
            d="M32 10c-8 0-14 6-14 14 0 9 9 18 14 24 5-6 14-15 14-24 0-8-6-14-14-14z"
            fill="#2B211A"
        />
        <Circle cx={32} cy={24} r={8} fill="#FFFFFF" />
        <Path
            d="M29 22h6a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-3a2 2 0 0 1 2-2z"
            fill="#C49A6C"
        />
    </Svg>
);

/**
 * 9. Tasse + éclair (café énergisant)
 */
export const CoffeeLogoEnergy = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={14} fill="#2B211A" />
        <Path
            d="M18 26h18a4 4 0 0 1 4 4v7a7 7 0 0 1-7 7H21a7 7 0 0 1-7-7v-7a4 4 0 0 1 4-4z"
            fill="#FFFFFF"
            stroke="#F4EDE6"
            strokeWidth={2}
        />
        <Path
            d="M34 28h3.5a4.5 4.5 0 0 1 0 9H34"
            fill="none"
            stroke="#F4EDE6"
            strokeWidth={2}
        />
        <Path
            d="M26 29l-3 6h4l-3 6 7-8h-4l3-4h-4z"
            fill="#C49A6C"
        />
    </Svg>
);

/**
 * 10. Badge bean (cercle + grain)
 */
export const CoffeeLogoBadgeBean = (props: SvgProps) => (
    <Svg viewBox="0 0 64 64" {...props}>
        <Rect width={64} height={64} rx={32} fill="#F4EDE6" />
        <Circle cx={32} cy={32} r={20} fill="#2B211A" />
        <Circle
            cx={32}
            cy={32}
            r={16}
            fill="none"
            stroke="#C49A6C"
            strokeWidth={2}
            strokeDasharray="4 3"
        />
        <Ellipse cx={32} cy={32} rx={6} ry={10} fill="#C49A6C" />
        <Path
            d="M30.5 24c-3 4-3 9 0 13 1.5 2 2.5 2.5 3.5 3"
            fill="none"
            stroke="#2B211A"
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);
