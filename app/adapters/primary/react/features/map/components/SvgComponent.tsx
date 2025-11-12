import useSVG from "@/app/adapters/secondary/viewModel/useSVG";
import {memo} from "react";
import {CoffeeId} from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";

type SvgDimensions = {
    width?: number;
    height?: number;
    coffeeId: CoffeeId | undefined;
};

const DEFAULT_DIMENSIONS: Required<SvgDimensions> = {
    width: 70,
    height: 70,
    coffeeId: undefined
};

const SvgComponentBase = ({ width = DEFAULT_DIMENSIONS.width, height = DEFAULT_DIMENSIONS.height }: SvgDimensions) => {
    const Logo = useSVG();

    return <Logo width={width} height={height} />;
};
const areEqual = (prev: SvgDimensions, next: SvgDimensions) =>
    prev.coffeeId === next.coffeeId &&
    (prev.width ?? DEFAULT_DIMENSIONS.width) === (next.width ?? DEFAULT_DIMENSIONS.width) &&
    (prev.height ?? DEFAULT_DIMENSIONS.height) === (next.height ?? DEFAULT_DIMENSIONS.height);

const SvgComponent = memo(SvgComponentBase, areEqual);

export default SvgComponent;
