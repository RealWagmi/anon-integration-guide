import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.AVALANCHE];

export const AVAX_DECIMALS = 18;
export const SAVAX_ADDRESS = '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE';

export const QI_DECIMALS = 18;
export const QI_ADDRESS = '0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5';
export const VE_QI_ADDRESS = '0x7Ee65Fdc1C534A6b4f9ea2Cc3ca9aC8d6c602aBd';

export const GAUGE_CONTROLLER_PROXY_ADDRESS = '0x14593cb3Ffe270a72862Eb08CeB57Bc3D4DdC16C';

export type NodesProps = {
    /**
     * @description list of node ids
     */
    nodeIds: string[];
};

export type NodesWithWeightsProps = NodesProps & {
    /**
     * @description list of weights provided as percentage with up to 2 decimal places
     * @example ['50.15', '49.85']
     */
    weights: string[];
};
