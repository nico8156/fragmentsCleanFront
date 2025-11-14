const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TIME_LENGTH = 10;
const RANDOM_LENGTH = 16;

const encodeTime = (time: number, len: number) => {
    let mod = time;
    let str = "";
    for (let i = len; i > 0; i--) {
        const index = mod % 32;
        str = ENCODING[index] + str;
        mod = Math.floor(mod / 32);
    }
    return str;
};

const randomChar = () => ENCODING[Math.floor(Math.random() * 32)];

const encodeRandom = (len: number) => {
    let str = "";
    for (let i = 0; i < len; i++) {
        str += randomChar();
    }
    return str;
};

export const ulid = (seedTime?: number): string => {
    const time = typeof seedTime === "number" ? seedTime : Date.now();
    const timePart = encodeTime(time, TIME_LENGTH);
    return `${timePart}${encodeRandom(RANDOM_LENGTH)}`;
};

export default ulid;
