import { useNavigation } from "@react-navigation/native";

import { ScanTicketSuccessContent } from "../components/ScanTicketSuccessContent";
import { RootStackNavigationProp } from "@/app/adapters/primary/react/navigation/types";

export function ScanTicketSuccessScreen() {
	const navigation = useNavigation<RootStackNavigationProp>();

	const goToTickets = () => {
		navigation.navigate("Tabs", {
			screen: "Profile",
			params: {
				screen: "Tickets",
			},
		});
	};

	const goToPass = () => {
		navigation.navigate("Tabs", {
			screen: "Rewards",
		});
	};

	return <ScanTicketSuccessContent onTickets={goToTickets} onPass={goToPass} />;
}

export default ScanTicketSuccessScreen;
