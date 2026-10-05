import { CoffeeId } from "@/app/core-logic/contextWL/coffeeWl/typeAction/coffeeWl.type";
import { useCafeFull } from "@/app/adapters/secondary/viewModel/useCafeFull";
import { CafeFullVM } from "@/app/core-logic/contextWL/coffeeWl/selector/coffeeWl.selector";
import { useCafeOpenNow } from "@/app/adapters/secondary/viewModel/useCafeOpenNow";
import { useDistanceToPoint } from "@/app/adapters/secondary/viewModel/useDistanceToPoint";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { CoffeeListCard } from "./CoffeeListCard";

type Props = {
    id: CoffeeId;
    onPress?: (id: CoffeeId) => void;
}

const CoffeeListItem = ({id, onPress}: Props) => {

    const {coffee}:{coffee:CafeFullVM|undefined} = useCafeFull(id)
    const isOpen = useCafeOpenNow(id)
    const distance = useDistanceToPoint(coffee ? {lat: coffee.location.lat, lng: coffee.location.lon} : undefined)
    const navigation = useNavigation<RootStackNavigationProp>();

    if(!coffee) return null

    const handlePress = () => {
        if(onPress) {
            onPress(id)
            return
        }
        navigation.navigate("CafeDetails", { id: coffee.id.toString() })
    }

    return <CoffeeListCard coffee={coffee} isOpen={isOpen} distanceText={distance.text} onPress={handlePress} />;
}

export default CoffeeListItem;
