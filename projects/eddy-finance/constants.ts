import { ChainId } from '@heyanon/sdk';
import { stringToHex } from 'viem';

export const supportedChains = [ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BASE, ChainId.BSC];

export const TSS_ADDRESS = '0x70e967acFcC17c3941E87562161406d41676FD83';
export const EDDY_CROSS_CHAIN_BRIDGE = '0x9E42B3D61E67669750bdd68835857B16df688FfD';
export const BTC_ZRC20 = '0x13a0c5930c028511dc02665e7285134b6d11a5f4';

export const getDataForCrossChain = (destToken: string, walletAddress: string) => {
    let data = '0x' + EDDY_CROSS_CHAIN_BRIDGE.slice(2) + destToken.slice(2) + walletAddress.slice(2);
    return data;
};

const getEncodedBitcoinWalletAddress = (bitcoinWalletAddress: string) => {
    // Convert string to hex bytes directly using viem's stringToHex
    const encodedData = stringToHex(bitcoinWalletAddress);

    return encodedData;
};

export const getDataForBitcoin = (btcWalletAddress: string) => {
    const encodedBitcoinWalletAddress = getEncodedBitcoinWalletAddress(btcWalletAddress);
    const data = getDataForCrossChain(BTC_ZRC20, encodedBitcoinWalletAddress);
    return data;
};

export const getNativeTokenName = (chainId: number) => {
    switch (chainId) {
        case ChainId.ETHEREUM:
            return 'ETH';
        case ChainId.BSC:
            return 'BNB';
        case ChainId.POLYGON:
            return 'POL';
        case ChainId.BASE:
            return 'ETH';
        default:
            return 'Not supported';
    }
};
