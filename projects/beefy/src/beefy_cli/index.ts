#!/usr/bin/env node

import { Command } from 'commander';
import { getVaults } from './getVaults';
import { getApyBreakdown } from './getApyBreakdown';
import { getTvl } from './getTvl';
import { getPrices } from './getPrices';
import { getLps } from './getLps';
import { getLpsBreakdown } from './getLpsBreakdown';
import { getTokens } from './getTokens';
import { getConfig } from './getConfig';
import { getBoosts } from './getBoosts';
import { getAddressTimeline } from './getAddressTimeline';
import { getProductsByChain } from './getProductsByChain';
import { getChains } from './getChains';
import { getSimplifiedVaults } from './getSimplifiedVaults';
import { getVault } from './getVault';
import { getUserVaults } from './getUserVaults';

const program = new Command();

program.name('beefy-cli').description('CLI for interacting with the Beefy Finance API').version('1.0.0');

// Register all commands

program.command('vaults').description('Get all vaults').action(getSimplifiedVaults);

program
    .command('vault')
    .description('Get a vault by id and chain')
    .requiredOption('--id <id>', 'Vault id, e.g. morpho-seamless-usdc')
    .requiredOption('--chain <chain>', 'Chain name, e.g. base')
    .action(getVault);

program
    .command('user-vaults')
    .description('Get all vaults where the user currently has a position')
    .requiredOption('--address <address>', 'Investor address')
    .requiredOption('--chain <chain>', 'Chain name, e.g. base')
    .action(getUserVaults);

program.command('raw-vaults').description('Get all vaults in raw format (no APY or TVL) from the /vaults endpoint').action(getVaults);

program.command('apy').description('Get APY breakdown for all vaults').action(getApyBreakdown);

program.command('tvl').description('Get Total Value Locked for all vaults').action(getTvl);

program.command('prices').description('Get token prices').action(getPrices);

program.command('lps').description('Get liquidity pool prices').action(getLps);

program.command('lps-breakdown').description('Get liquidity pool breakdown').action(getLpsBreakdown);

program.command('tokens').description('Get tokens').action(getTokens);

program.command('config').description('Get Beefy configuration').action(getConfig);

program.command('chains').description('Get chains supported by Beefy').action(getChains);

program.command('boosts').description('Get Boosts').action(getBoosts);

program.command('timeline').description('Get address timeline from Databarn').requiredOption('--address <address>', 'Investor address').action(getAddressTimeline);

program.command('products').description('Get products by chain from Databarn').requiredOption('--chain <chain>', 'Chain name').action(getProductsByChain);

program.parse(process.argv);
