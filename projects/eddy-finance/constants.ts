import { ChainId } from '@heyanon/sdk';
import { stringToHex } from 'viem';
import { mainnet, bsc, polygon, base } from 'viem/chains';

// Custom btc chain id in our db
export const BTC_CHAIN_ID = 9999;

export const supportedChains = [ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BASE, ChainId.BSC, BTC_CHAIN_ID];

export const TSS_ADDRESS = '0x70e967acFcC17c3941E87562161406d41676FD83';
export const EDDY_CROSS_CHAIN_BRIDGE = '0x9E42B3D61E67669750bdd68835857B16df688FfD';
export const BTC_ZRC20 = '0x13a0c5930c028511dc02665e7285134b6d11a5f4';
export const USDC_ZRC20 = '0x0cbe0df132a6c6b4a2974fa1b7fb953cf0cc798a';
export const USDT_ZRC20 = '0x7c8dda80bbbe1254a7aacf3219ebe1481c6e01d7';
export const ETH_ZRC20 = '0xd97b1de3619ed2c6beb3860147e30ca8a7dc9891';
export const PEPE_ZRC20 = '0x236b0de675cc8f46ae186897fccefe3370c9eded';
export const DAI_ZRC20 = '0xcc683a782f4b30c138787cb5576a86af66fdc31d';
export const EDDY_GRAPHQL_URL = 'https://apiv2.eddy.finance/graphql';

interface BridgeQuoteResponse {
    estimatedRecievedAmount: string;
    quoteAmount: string;
    minimumReceived: string;
}

export const RETRIES = 3;

export const DELAY = 1000;

export const getZRC20Address = (destTokenSymbol: string) => {
    switch (destTokenSymbol.toLowerCase()) {
        case 'USDT'.toLowerCase():
            return USDT_ZRC20;
        case 'USDC'.toLowerCase():
            return USDC_ZRC20;
        case 'DAI'.toLowerCase():
            return DAI_ZRC20;
        case 'PEPE'.toLowerCase():
            return PEPE_ZRC20;
        case 'ETH'.toLowerCase():
            return ETH_ZRC20;
        default:
            return 'Unsupported';
    }
};

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
    const chain = [mainnet, bsc, polygon, base].find((c) => c.id === chainId);
    return chain?.nativeCurrency.symbol || 'Not supported';
};

export const fetchBridgeQuote = async (
    inputTokenAddress: string,
    outputTokenAddress: string,
    inputAmount: string,
    slippage: number,
    fromChainId: number,
    toChainId: number,
): Promise<BridgeQuoteResponse> => {
    const query = `
    query {
      getBridgeQuoteByTokenAddress(
        bridgeQuoteInput: {
          inputTokenAddress: "${inputTokenAddress}"
          outputTokenAddress: "${outputTokenAddress}"
          inputAmount: "${inputAmount}"
          slippage: ${slippage}
          fromChainId: ${fromChainId}
          toChainId: ${toChainId}
        }
      ) {
        estimatedRecievedAmount
        quoteAmount
        minimumReceived
      }
    }
  `;

    try {
        const response = await fetch(EDDY_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.data) {
            throw new Error(`Invalid response: ${JSON.stringify(result)}`);
        }

        return result.data.getBridgeQuoteByTokenAddress;
    } catch (error) {
        console.error('Error fetching bridge quote:', error);
        throw error;
    }
};
