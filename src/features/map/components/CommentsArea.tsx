import {Text, View, StyleSheet, TextInput, Pressable} from "react-native";
import {palette} from "@/app/adapters/primary/react/css/colors";
import {useState} from "react";

const CommentsArea = () => {
    const [text, onChangeText] = useState('');
    return(
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <TextInput
                    style={styles.inputText}
                    placeholder={"Ecrivez votre commentaire ici"}
                    onChangeText={onChangeText}
                    value={text}
                    keyboardType={"web-search"}
                    multiline={true}
                    numberOfLines={4}
                    maxLength={250}>
                </TextInput>
            </View>
            <Pressable style={[styles.buttonInput, text.length > 0 && styles.buttonInputActive ]}>
                <Text style={styles.buttonText}>Commenter</Text>
            </Pressable>
        </View>
    )

}
export default CommentsArea;

const styles = StyleSheet.create({
    container:{
      gap:30
    },
    wrapper:{
        width: '96%',
        padding:15,
        borderWidth:1,
        height:120,
        borderRadius:15,
    },
    inputText:{
        fontSize:14,
        color:palette.surface,
    },
    buttonInput:{
        width: '96%',
        padding:15,
        backgroundColor: palette.textMuted_1,
        borderRadius:15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonInputActive:{
      backgroundColor:palette.success_60
    },
    buttonText:{
        color: palette.textPrimary,
        fontSize: 18,
    }

})