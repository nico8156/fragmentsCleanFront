import { useSelector } from "react-redux";
import { AppStateWl } from "@/app/store/appStateWl";
import CoffeeMarker from "@/app/adapters/primary/react/components/coffeeSelection/coffeeMarker";

type Props = {
    onSelect?: (id: string) => void;
    selectedId?: string | null;
    zoomLevel: number;
};

const CoffeeSelection = ({ onSelect, selectedId, zoomLevel }: Props) => {
    const ids = useSelector((s: any) => s.cfState.ids) as AppStateWl["coffees"]["ids"];

    return (
        <>
            {ids.map((id) => (
                <CoffeeMarker
                    key={id}
                    id={id}
                    onSelect={onSelect}
                    selected={selectedId === id}
                    zoomLevel={zoomLevel}
                />
            ))}
        </>
    );
};

export default CoffeeSelection;