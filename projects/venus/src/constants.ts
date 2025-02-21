import { Chain, EVM } from '@heyanon/sdk';
import { Address } from 'viem';
const { ChainIds } = EVM.constants;
export const supportedChains = [ChainIds[Chain.BSC], ChainIds[Chain.ETHEREUM], ChainIds[Chain.BASE]];

export const supportedPools = ['CORE', 'DEFI'];

export const XVS_STAKE_ADDRESS: { [key: number]: Address } = {
	[ChainIds.bsc]: '0x051100480289e704d20e9DB4804837068f3f9204',
	[ChainIds.ethereum]: '0xA0882C2D5DF29233A092d2887A258C2b90e9b994',
	[ChainIds.base]: '0x708B54F2C3f3606ea48a8d94dab88D9Ab22D7fCd',
};

export const XVS_STAKE_POOL = BigInt(0);

export const XVS_TOKEN: { [key: number]: Address } = {
	[ChainIds.bsc]: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',
	[ChainIds.base]: '0xebB7873213c8d1d9913D8eA39Aa12d74cB107995',
	[ChainIds.ethereum]: '0xd3CC9d8f3689B83c91b7B59cAB4946B063EB894A',
};

export const ORACLE_ADDRESS: { [key: number]: Address } = {
	[ChainIds.bsc]: '0x6592b5DE802159F3E74B2486b091D11a8256ab8A',
	[ChainIds.base]: '0xcBBf58bD5bAdE357b634419B70b215D5E9d6FbeD',
	[ChainIds.ethereum]: '0xd2ce3fb018805ef92b8C5976cb31F84b4E295F94',
};

interface Token {
	address: Address;
	chainBased?: boolean;
}

interface CorePoolMarketTokens {
	[key: string]: Token;
}

interface TokenConfig {
	[chainId: number]: CorePoolMarketTokens;
}

interface PoolDetails {
	comptroller: { [key: number]: Address };
	poolTokens: TokenConfig;
}

interface Pool {
	[pool: string]: PoolDetails;
}

export const DEFI_POOL_MARKET_TOKENS: TokenConfig = {
	[ChainIds.bsc]: {
		ALPACA: { address: '0x02c5Fb0F26761093D297165e902e96D08576D344' },
		ANKR: { address: '0x19CE11C8817a1828D1d357DFBF62dCf5b0B2A362' },
		ankrBNB: { address: '0x53728FD51060a85ac41974C6C3Eb1DaE42776723' },
		BSW: { address: '0x8f657dFD3a1354DEB4545765fE6840cc54AFd379' },
		PLANET: { address: '0xFf1112ba7f88a53D4D23ED4e14A117A2aE17C6be' },
		TWT: { address: '0x736bf1D21A28b5DC19A1aC8cA71Fc2856C23c03F' },
		USDD: { address: '0xA615467caE6B9E0bb98BC04B4411d9296fd1dFa0' },
		USDT: { address: '0x1D8bBDE12B6b34140604E18e9f9c6e14deC16854' },
	},
};

export const CORE_POOL_MARKET_TOKENS: TokenConfig = {
	[ChainIds.bsc]: {
		AAVE: { address: '0x26DA28954763B92139ED49283625ceCAf52C6f94' },
		ADA: { address: '0x9A0AF7FDb2065Ce470D72664DE73cAE409dA28Ec' },
		BCH: { address: '0x5F0388EBc2B94FA8E123F404b79cCF5f40b29176' },
		BETH: { address: '0x972207A639CC1B374B893cc33Fa251b55CEB7c07' },
		BNB: { address: '0xA07c5b74C9B40447a954e1466938b865b6BBea36', chainBased: true },
		BTCB: { address: '0x882C173bC7Ff3b7786CA16dfeD3DFFfb9Ee7847B' },
		BUSD: { address: '0x95c78222B3D6e262426483D42CfA53685A67Ab9D' },
		CAKE: { address: '0x86aC3974e2BD0d60825230fa6F355fF11409df5c' },
		DAI: { address: '0x334b3eCB4DCa3593BCCC3c7EBD1A1C1d1780FBF1' },
		DOT: { address: '0x1610bc33319e9398de5f57B33a5b184c806aD217' },
		FDUSD: { address: '0xC4eF4229FEc74Ccfe17B2bdeF7715fAC740BA0ba' },
		FIL: { address: '0xf91d58b5aE142DAcC749f58A49FCBac340Cb0343' },
		LINK: { address: '0x650b940a1033B8A1b1873f78730FcFC73ec11f1f' },
		LTC: { address: '0x57A5297F2cB2c0AaC9D554660acd6D385Ab50c6B' },
		LUNA: { address: '0xb91A659E88B51474767CD97EF3196A3e7cEDD2c8' },
		SXP: { address: '0x2fF3d0F6990a40261c66E1ff2017aCBc282EB6d0' },
		SolvBTC: { address: '0xf841cb62c19fCd4fF5CD0AaB5939f3140BaaC3Ea' },
		TRX: { address: '0xC5D3466aA484B040eE977073fcF337f2c00071c1' },
		TUSD: { address: '0xBf762cd5991cA1DCdDaC9ae5C638F5B5Dc3Bee6E' },
		TWT: { address: '0x4d41a36D04D97785bcEA57b057C412b278e6Edcc' },
		UNI: { address: '0x27FF564707786720C71A2e5c1490A63266683612' },
		USDC: { address: '0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8' },
		USDT: { address: '0xfD5840Cd36d94D7229439859C0112a4185BC0255' },
		WBETH: { address: '0x6CFdEc747f37DAf3b87a35a1D9c8AD3063A1A8A0' },
		XRP: { address: '0xB248a295732e0225acd3337607cc01068e3b9c10' },
		XVS: { address: '0x151B1e2635A717bcDc836ECd6FbB62B674FE3E1D' },
		THE: { address: '0x86e06EAfa6A1eA631Eab51DE500E3D474933739f' },
	},
	[ChainIds.ethereum]: {
		BAL: { address: '0x0Ec5488e4F8f319213a14cab188E01fB8517Faa8' },
		crvUSD: { address: '0x672208C10aaAA2F9A6719F449C4C8227bc0BC202' },
		DAI: { address: '0xd8AdD9B41D4E1cd64Edad8722AB0bA8D35536657' },
		eBTC: { address: '0x325cEB02fe1C2fF816A83a5770eA0E88e2faEcF2' },
		EIGEN: { address: '0x256AdDBe0a387c98f487e44b85c29eb983413c5e' },
		FRAX: { address: '0x4fAfbDc4F2a9876Bd1764827b26fb8dc4FD1dB95' },
		LBTC: { address: '0x25C20e6e110A1cE3FEbaCC8b7E48368c7b2F0C91' },
		sFRAX: { address: '0x17142a05fe678e9584FA1d88EfAC1bF181bF7ABe' },
		SUSDS: { address: '0xE36Ae842DbbD7aE372ebA02C8239cd431cC063d6' },
		TUSD: { address: '0x13eB80FDBe5C5f4a7039728E258A6f05fb3B912b' },
		USDC: { address: '0x17C07e0c232f2f80DfDbd7a95b942D893A4C5ACb' },
		USDS: { address: '0x0c6B19287999f1e31a5c0a44393b24B62D2C0468' },
		USDT: { address: '0x8C3e3821259B82fFb32B2450A95d2dcbf161C24E' },
		WBTC: { address: '0x8716554364f20BCA783cb2BAA744d39361fd1D8d' },
		WETH: { address: '0x7c8ff7d2A1372433726f879BD945fFb250B94c65' },
	},
	[ChainIds.base]: {
		USDC: { address: '0x3cb752d175740043Ec463673094e06ACDa2F9a2e' },
		cbBTC: { address: '0x7bBd1005bB24Ec84705b04e1f2DfcCad533b6D72' },
		WETH: { address: '0xEB8A79bD44cF4500943bf94a2b4434c95C008599' },
		wsuperOETHb: { address: '0x75201D81B3B0b9D17b179118837Be37f64fc4930' },
	},
};

export const BLOCKS_PER_YEAR = {
	[ChainIds.bsc]: BigInt(10512000),
	[ChainIds.ethereum]: BigInt(2628000),
	[ChainIds.base]: BigInt(15768000),
};

export const POOLS: Pool = {
	CORE: {
		comptroller: {
			[ChainIds.bsc]: '0xfD36E2c2a6789Db23113685031d7F16329158384',
			[ChainIds.base]: '0x0C7973F9598AA62f9e03B94E92C967fD5437426C',
			[ChainIds.ethereum]: '0x687a01ecF6d3907658f7A7c714749fAC32336D1B',
		},
		poolTokens: CORE_POOL_MARKET_TOKENS,
	},
	DEFI: {
		comptroller: {
			[ChainIds.bsc]: '0x3344417c9360b963ca93A4e8305361AEde340Ab9',
		},
		poolTokens: DEFI_POOL_MARKET_TOKENS,
	},
};
