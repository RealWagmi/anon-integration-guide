// Export all ABIs
export const marketAbi = require("./IPMarket.json").abi;
export const gaugeControllerAbi = require("./IPGaugeController.json").abi;
export const feeDistributorAbi = require("./IPFeeDistributor.json").abi;
export const marketFactoryAbi = require("./IPMarketFactory.json").abi;
export const votingEscrowAbi = require("./IPVotingEscrow.json").abi;

// Re-export types
export type { IPMarket } from "./types/IPMarket";
export type { IPGaugeController } from "./types/IPGaugeController";
export type { IPFeeDistributor } from "./types/IPFeeDistributor";
export type { IPMarketFactory } from "./types/IPMarketFactory";
export type { IPVotingEscrow } from "./types/IPVotingEscrow"; 