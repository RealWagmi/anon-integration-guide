import { Address, Hex } from 'viem';
import { FEE_SIZE, FeeAmount, FEE_AMOUNTS } from '../constants';

export const encodePath = (tokens: Address[], fees: FeeAmount[]): Hex => {
    if (tokens.length != fees.length + 1) {
        throw new Error('tokens/fee lengths do not match');
    }

    let encoded = '0x';
    for (let i = 0; i < fees.length; i++) {
        // 20 byte encoding of the address
        encoded += tokens[i].slice(2);
        // 3 byte encoding of the fee
        encoded += FEE_AMOUNTS[fees[i]].toString(16).padStart(2 * FEE_SIZE, '0');
    }
    // encode the final token
    encoded += tokens[tokens.length - 1].slice(2);

    return encoded.toLowerCase() as Hex;
};

export const encodePathV2 = (tokens: Address[], stables: boolean[]): Hex => {
    if (tokens.length != stables.length + 1) {
        throw new Error('tokens/stables lengths do not match');
    }

    let encoded = '0x';
    for (let i = 0; i < stables.length; i++) {
        // 20 byte encoding of the address
        encoded += tokens[i].slice(2);
        // 3 byte encoding of the fee
        const fee = FEE_AMOUNTS[(stables[i]) ? "V2_STABLE" : "V2_VOLATILE"];
        encoded += fee.toString(16).padStart(2 * FEE_SIZE, '0');
    }
    // encode the final token
    encoded += tokens[tokens.length - 1].slice(2);

    return encoded.toLowerCase() as Hex;
};
