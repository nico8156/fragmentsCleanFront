// 1) Bridge AppState → actions
import {AppState} from "react-native";

AppState.addEventListener("change", (status) => {
    // status: "active" | "background" | "inactive"
    switch (status) {
        case "active":   lm.dispatch(appBecameActive()); break;
        case "background": lm.dispatch(appBecameBackground()); break;
        case "inactive": lm.dispatch(appBecameInactive()); break;
    }
});