module.exports = {
    preset: 'jest-expo',
    testEnvironment: 'node', // "node" suffit pour tests Redux/domaine; mets "jsdom" pour tests UI
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(' +
        [
            'react-native',
            'react-native-.*',
            '@react-native',
            'expo',
            'expo-.*',
            '@expo',
            'unimodules-.*',
            '@unimodules/.*',
            'sentry-expo',
            'lottie-react-native',
            'react-native-reanimated',
            'react-native-gesture-handler',
        ].join('|') +
        ')/)',
    ]
};
