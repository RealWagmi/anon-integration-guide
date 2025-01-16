import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains, cometsEnum, collateralAssetsEnum } from './constants';

const baseAssetDescription = `The base asset of the Compound protocol. This is the asset that can be borrowed against other collateral assets.`;

export const tools: AiTool[] = [
    {
        name: 'getAPRForAllMarkets',
        description: 'Returns the APR and utilization rate for all markets in the Compound protocol.',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get the APRs for',
            },
        ],
    },
    {
        name: 'getAPRForMarket',
        description: 'Returns the APR and utilization rate for a specific market in the Compound protocol.',
        required: ['chainName', 'baseAsset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get the APR for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'getBorrowedForAllMarkets',
        description: 'Returns the amount of base asset that has been borrowed from all markets in the Compound protocol by a user.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get the borrowed amounts for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to get the borrowed amounts for',
            },
        ],
    },
    {
        name: 'getBorrowedForMarket',
        description: 'Returns the amount of base asset that has been borrowed from a market in the Compound protocol by a user.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get the borrowed amounts for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to get the borrowed amounts for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'getCollateralForMarket',
        description: 'Returns the amount of collateral asset that has been supplied to a market to borrow the base asset in the Compound protocol by a user.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get collateral amounts for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to get the collateral amounts for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'getSuppliedForAllMarkets',
        description: 'Returns the amount of base asset that has been supplied to all markets in the Compound protocol by a user.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get the supplied amounts for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to get the supplied amounts for',
            },
        ],
    },
    {
        name: 'getSuppliedForMarket',
        description: 'Returns the amount of base asset that has been supplied to a market in the Compound protocol by a user.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to get the supplied amounts for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to get the supplied amounts for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'repay',
        description: 'Repays the borrowed base asset of a market in the Compound protocol.',
        required: ['chainName', 'account', 'baseAsset', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to repay the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to repay the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of base asset to repay',
            },
        ],
    },
    {
        name: 'repayAll',
        description: 'Repays all the borrowed base asset of a market in the Compound protocol.',
        required: ['chainName', 'account', 'baseAsset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to repay the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to repay the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'supplyBase',
        description: 'Supplies the base asset to a market in the Compound protocol.',
        required: ['chainName', 'account', 'baseAsset', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to supply the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to supply the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of base asset to supply',
            },
        ],
    },
    {
        name: 'supplyBaseAll',
        description: "Supplies all the user's base asset to a market in the Compound protocol.",
        required: ['chainName', 'account', 'baseAsset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to supply the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to supply the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'supplyCollateral',
        description: 'Supplies a collateral asset to a market in the Compound protocol, allowing users to borrow the base asset.',
        required: ['chainName', 'account', 'baseAsset', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to supply the collateral asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to supply the collateral asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
            {
                name: 'supplyAsset',
                type: 'string',
                enum: collateralAssetsEnum,
                description: 'The collateral asset to supply',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of collateral asset to supply',
            },
        ],
    },
    {
        name: 'borrow',
        description: 'Borrows the base asset from a market in the Compound protocol.',
        required: ['chainName', 'account', 'baseAsset', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to borrow the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to borrow the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of base asset to borrow',
            },
        ],
    },
    {
        name: 'withdrawBase',
        description: "Withdraws the user's supplied base asset from a market in the Compound protocol.",
        required: ['chainName', 'account', 'baseAsset', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to withdraw the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to withdraw the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of base asset to withdraw',
            },
        ],
    },
    {
        name: 'withdrawBaseAll',
        description: "Withdraws all the user's supplied base asset from a market in the Compound protocol.",
        required: ['chainName', 'account', 'baseAsset'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to withdraw the base asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to withdraw the base asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
        ],
    },
    {
        name: 'withdrawCollateral',
        description: 'Withdraws a collateral asset from a market in the Compound protocol.',
        required: ['chainName', 'account', 'baseAsset', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain to withdraw the collateral asset for',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to withdraw the collateral asset for',
            },
            {
                name: 'baseAsset',
                type: 'string',
                enum: cometsEnum,
                description: baseAssetDescription,
            },
            {
                name: 'supplyAsset',
                type: 'string',
                enum: collateralAssetsEnum,
                description: 'The collateral asset to withdraw',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of collateral asset to withdraw',
            },
        ],
    },
];
