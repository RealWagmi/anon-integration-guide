import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.IOTA];

export const TOKEN = {
    WETH: {
        ADDRESS: '0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8',
        DECIMALS: 18,
        MARKET: {
            ADDRESS: '0x0f571c5F3c328f57CDDDF204D752C7Ddb49686d5', //dWETH
            DECIMALS: 8,
        }
    },
    WIOTA: {
        ADDRESS: '0x6e47f8d48a01b44DF3fFF35d258A10A3AEdC114c',
        DECIMALS: 18,
        MARKET: {
            ADDRESS: '0x260817581206317E2665080A2E66854e922269d0', //dWIOTA
            DECIMALS: 8,
        }
    },
    USDC: {
        ADDRESS: '0xFbDa5F676cB37624f28265A144A48B0d6e87d3b6',
        DECIMALS: 6,
        MARKET: {
            ADDRESS: '0xf96AdBfcd3EB9fd61faDa3F2eD70Ac47e3E1e045', //dUSDC
            DECIMALS: 8,
        }
    },
    USDCE: {
        ADDRESS: '0xFbDa5F676cB37624f28265A144A48B0d6e87d3b6',
        DECIMALS: 6,
        MARKET: {
            ADDRESS: '0xf96AdBfcd3EB9fd61faDa3F2eD70Ac47e3E1e045', //dUSDC
            DECIMALS: 8,
        }
    },
    CONTRACT: {
        UNITROLLER: '0xee07121d97FDEA35675e02017837a7a43aeDa48F',
        DEEPRLENS: '0xDe131E97c396ED48A27ebc9E2A93824216566675',
        REWARDPOOL: '0x18041C94D941177574A1D79b0c55DD894E9E02bC',
        ORACLE: '0xE0C2F67E7533CF7D8D80F649Eec22a45eA7a7BA8',
        DEEPR: {
            ADDRESS: '0x4Eb8E03461360C2AcBb4B5963a18b8f9faEE8221',
            DECIMALS: 18,
        }
    }
}