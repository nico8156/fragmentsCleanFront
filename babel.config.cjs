module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // si tu utilises "@/..."
            ['module-resolver', {
                root: ['./'],
                alias: { '@': './' },
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            }],
            // à garder en dernier si tu utilises reanimated
            'react-native-reanimated/plugin',
        ],
    };
};
