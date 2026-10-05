import { View } from "react-native";
import { palette } from "@/app/adapters/primary/react/css/colors";
import { ScrollClearance } from "@/app/adapters/primary/react/components/design/ScrollClearance";
import { useScanTicketScreenVM } from "@/app/adapters/secondary/viewModel/useScanTicketScreenVM";
import { ScanTicketContent } from "../components/ScanTicketContent";

export function ScanTicketScreen() {
    const vm = useScanTicketScreenVM();
    return <View style={{ flex: 1, backgroundColor: palette.background }}><ScrollClearance floatingTab={false}><ScanTicketContent vm={vm} /></ScrollClearance></View>;
}
export default ScanTicketScreen;
