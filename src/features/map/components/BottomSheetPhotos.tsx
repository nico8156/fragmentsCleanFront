import {View, StyleSheet, FlatList} from "react-native";
import {Image} from "expo-image";


type Props = {
    photos:string[] | undefined;
}
const BottomSheetPhotos = (props:Props) => {
    const {photos} = props;

    return (
        <View style={styles.container}>
            <FlatList
                horizontal
                data={photos}
                keyExtractor={(_, index) => `${index}`}
                renderItem={({ item: photo }) => (
                    <Image source={photo} style={styles.photoItem} contentFit={'cover'} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
                ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />
        </View>
    )
}

export default BottomSheetPhotos;

const styles = StyleSheet.create({
    container:{
        flexDirection: 'row',
        marginTop:30
    },
    photoList: {
        paddingVertical: 12,
    },
    photoItem: {
        width: 150,
        height: 150,
        borderRadius: 16,
        backgroundColor: '#EAEAEA',
    },
})