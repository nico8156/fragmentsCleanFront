import { Marker } from "react-native-maps";

import { parseToCoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { CoffeeOnMap } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { CoffeeMarkerBubble } from "@/app/adapters/primary/react/features/map/components/coffeeSelection/CoffeeMarkerBubble";
import { CoffeeMarkerLabel } from "@/app/adapters/primary/react/features/map/components/coffeeSelection/CoffeeMarkerLabel";

type Props = {
    coffee: CoffeeOnMap;
    onSelect?: () => void;
    selected?: boolean;
    zoomLevel: number;
    coordinate: { latitude: number; longitude: number };
};

function CoffeeMarker(props: Props) {
    const { coffee, selected, zoomLevel, onSelect, coordinate } = props;

    const showExpanded = zoomLevel <= 0.015;
    const isOpen = useCafeOpenNow(parseToCoffeeId(coffee.id));

    const handlePress = () => {
        onSelect?.();
    };

    return (
        <Marker
            coordinate={coordinate}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={handlePress}
        >
            <CoffeeMarkerBubble isOpen={isOpen} showExpanded={showExpanded} selected={selected} />
            <CoffeeMarkerLabel name={coffee?.name ?? "Café"} />
        </Marker>
    );
}

export default CoffeeMarker;
