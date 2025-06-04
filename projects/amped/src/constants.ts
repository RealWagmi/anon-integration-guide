import { Chain, EVM } from '@heyanon/sdk';
import { Address } from 'viem';

// Constants for APR calculations
export const PRECISION = 1e30;
export const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
export const BASIS_POINTS_DIVISOR = 10000;

const { ChainIds } = EVM.constants;

// Supported chains enum
export enum SupportedChain {
    SONIC = ChainIds[Chain.SONIC],
    BASE = ChainIds[Chain.BASE]
}

// Supported chains array
export const supportedChains = Object.values(SupportedChain).filter((v): v is number => typeof v === 'number') as readonly number[];

// Other global constants can go here

export const CONTRACT_ADDRESSES: Record<number, Record<string, Address>> = {
    [SupportedChain.SONIC]: {
        GLP_MANAGER: '0x4DE729B85dDB172F1bb775882f355bA25764E430' as Address,
        GLP_TOKEN: '0x6fbaeE8bEf2e8f5c34A08BdD4A4AB777Bd3f6764' as Address,
        REWARD_ROUTER: '0xE72A2d5B3b09c88D4E8Cc60e74BD438d7168e80F' as Address,
        REWARD_DISTRIBUTOR: '0xfcb51C49cE6A23d370797a7E3e601046b43B6172' as Address,
        ALP_REWARD_DISTRIBUTOR: '0x2a7663A3e6961dC43bEcbF752DcC9798C1c22a6A' as Address,
        ALP_FEE_REWARD_DISTRIBUTOR: '0xb6600B4328e417d21a7CfbAa11758F57A0E5A3E6' as Address,
        REWARD_TRACKER: '0x765d548229169E14b397c8c87FF7E8a64f36F469' as Address,
        VAULT: '0x5B8caae7cC6Ea61fb96Fd251C4Bc13e48749C7Da' as Address,
        ROUTER: '0x451D212c080267feF47Fd777002C9186e61C5a2C' as Address,
        POSITION_ROUTER: '0x69E44517D74709d552A69046585bef02d8c34D5B' as Address,
        VAULT_PRICE_FEED: '0x51B9fcDF00423D597066A8a041ab38152a74Fe96' as Address,
        FS_ALP: '0xB895e3DBFB37A4Cc6b4FB50B1cf903608e942FF9' as Address,
        ALP_VESTER: '0x931d5560D236e0780FD872331e28D7598E0DeDcc' as Address,
        // Special addresses
        NATIVE_TOKEN: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address,
        WRAPPED_NATIVE_TOKEN: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38' as Address // WS
    },
    [SupportedChain.BASE]: {
        GLP_MANAGER: '0xD24c217230DAf4036E290133861EfF4B9aDB2b27' as Address,
        GLP_TOKEN: '0x317b79Ac01Ed43755F72472B04ad31297e33ab98' as Address,
        REWARD_ROUTER: '0xa9B2E867520EbD705018a4E088057bE1cdBB2A78' as Address,
        REWARD_DISTRIBUTOR: '0x15602eD2C2A4c9Fb91EdC884D215de94b3769276' as Address,
        REWARD_TRACKER: '0x12905Eb64C3A70c6a7D3E1f0A4BA3213C23BE051' as Address,
        VAULT: '0xed33E4767B8d68bd7F64c429Ce4989686426a926' as Address,
        ROUTER: '0x700d165ef6e5c79b9BD83D2C328391FE61917af6' as Address,
        POSITION_ROUTER: '0xff2B2953C11D1B431Fa03dAA12489124d8E47BdB' as Address,
        VAULT_PRICE_FEED: '0x2d918cBEbc9818FB372E2327bc6709132Aa17A71' as Address,
        ALP_VESTER: '0x059580aC18587202FE37AA53D29f44D42dF992b4' as Address,
        // Special addresses
        NATIVE_TOKEN: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address,
        WRAPPED_NATIVE_TOKEN: '0x4200000000000000000000000000000000000006' as Address // WETH
    }
} as const;
