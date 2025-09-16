import { AdapterExport, AdapterTag, Chain, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';
import * as functions from './functions';
import { tools } from './tools';

const { getChainName } = EVM.utils;

export default {
	tools,
	functions,
	description:
		'Sky (ex MakerDAO): STR (stake USDS to earn SKY) and SSR (auto-compounding sUSDS). STR: staking, partial/total withdrawal, reward claiming; read staked balance, pending rewards, reward rate. SSR: deposit/mint sUSDS, withdraw/burn, redeem; conversion quotes USDS↔sUSDS; max withdraw/redeem. Utilities: full user position overview; list of supported chains.',
	tags: [AdapterTag.FARM],
	chains: supportedChains.map(getChainName) as Chain[],
	executableFunctions: ['stakeSTR', 'withdrawSTR', 'claimRewardSTR', 'exitSTR', 'depositSSR', 'withdrawSSR', 'redeemSSR'],
} satisfies AdapterExport;
