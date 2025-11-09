import useSVG from "@/app/adapters/secondary/viewModel/useSVG";

type SvgDimensions = {
    width?: number;
    height?: number;
};

const DEFAULT_DIMENSIONS: Required<SvgDimensions> = {
    width: 70,
    height: 70,
};

const SvgComponent = ({ width = DEFAULT_DIMENSIONS.width, height = DEFAULT_DIMENSIONS.height }: SvgDimensions) => {
    const Logo = useSVG();

    return <Logo width={width} height={height} />;
};

export default SvgComponent;
