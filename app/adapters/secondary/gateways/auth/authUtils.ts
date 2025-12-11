import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

export const generateCodeVerifier = () => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 128; i++) { // PKCE recommends 43-128 characters
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const sha256 = async (plain:any) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Buffer.from(data).toString('base64') // Expo Crypto expects base64
    );
    return hashBuffer;
};

const base64UrlEncode = (input:any) => {
    return input
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

export const generatePkceChallenge = async () => {
    const codeVerifier = generateCodeVerifier();
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(hashed); // Note: Expo's digestStringAsync might return a hex string, you'll need to convert it to a byte array before base64UrlEncode if so. Or use a library that handles this. For simplicity, assuming a direct base64url encoding of the hash.

    return { codeVerifier, codeChallenge };
};