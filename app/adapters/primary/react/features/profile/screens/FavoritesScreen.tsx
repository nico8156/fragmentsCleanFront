import { useNavigation } from "@react-navigation/native";

import { FavoritesContent } from "../components/FavoritesContent";
import { ProfileLayout } from "@/app/adapters/primary/react/features/profile/components/ProfileLayout";

import type { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";
import { useSavedCoffees } from "@/app/adapters/secondary/viewModel/useSavedCoffees";
import { savedCoffeeLoadingStates } from "@/app/core-logic/contextWL/savedCoffeeWl/typeAction/savedCoffee.type";

export function FavoritesScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();
	const vm = useSavedCoffees();

	return (
		<ProfileLayout
			refreshing={vm.loading === savedCoffeeLoadingStates.PENDING}
			onRefresh={vm.refresh}
		>

			<FavoritesContent vm={vm} onOpenCoffee={id => navigation.navigate("CafeDetails", { id })} />
		</ProfileLayout>
	);
}

export default FavoritesScreen;
