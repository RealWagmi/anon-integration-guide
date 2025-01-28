var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants';
export function getLeverageLiquidity(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var vault, poolAmount, reservedAmount, maxGlobalSize, fundingRate, _c, error_1, error_2, availableLiquidity, maxLeverage, maxCollateral, error_3;
        var provider = _b.provider, vaultAddress = _b.vaultAddress, indexToken = _b.indexToken, collateralToken = _b.collateralToken, isLong = _b.isLong;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    vault = new ethers.Contract(vaultAddress, Vault, provider);
                    poolAmount = ethers.BigNumber.from(0);
                    reservedAmount = ethers.BigNumber.from(0);
                    maxGlobalSize = ethers.BigNumber.from(0);
                    fundingRate = ethers.BigNumber.from(0);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 15, , 16]);
                    console.log('Getting pool amount...');
                    return [4 /*yield*/, vault.poolAmounts(indexToken)];
                case 2:
                    poolAmount = _d.sent();
                    console.log('Getting reserved amount...');
                    return [4 /*yield*/, vault.reservedAmounts(indexToken)];
                case 3:
                    reservedAmount = _d.sent();
                    console.log('Getting max global sizes...');
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 9, , 10]);
                    if (!isLong) return [3 /*break*/, 6];
                    return [4 /*yield*/, vault.maxGlobalLongSizes(indexToken)];
                case 5:
                    _c = _d.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, vault.maxGlobalShortSizes(indexToken)];
                case 7:
                    _c = _d.sent();
                    _d.label = 8;
                case 8:
                    maxGlobalSize = _c;
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _d.sent();
                    console.log("Failed to get max global ".concat(isLong ? 'long' : 'short', " size:"), error_1);
                    return [3 /*break*/, 10];
                case 10:
                    console.log('Getting funding rate...');
                    _d.label = 11;
                case 11:
                    _d.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, vault.cumulativeFundingRates(collateralToken)];
                case 12:
                    fundingRate = _d.sent();
                    return [3 /*break*/, 14];
                case 13:
                    error_2 = _d.sent();
                    console.log('Failed to get funding rate:', error_2);
                    return [3 /*break*/, 14];
                case 14:
                    availableLiquidity = poolAmount.sub(reservedAmount);
                    maxLeverage = isLong ? 11 : 10;
                    maxCollateral = maxGlobalSize.div(maxLeverage);
                    console.log('Results:', {
                        maxLeverage: maxLeverage,
                        maxPositionSize: maxGlobalSize.toString(),
                        maxCollateral: maxCollateral.toString(),
                        poolAmount: poolAmount.toString(),
                        reservedAmount: reservedAmount.toString(),
                        availableLiquidity: availableLiquidity.toString(),
                        fundingRate: fundingRate.toString()
                    });
                    return [2 /*return*/, {
                            maxLeverage: maxLeverage,
                            maxPositionSize: maxGlobalSize,
                            maxCollateral: maxCollateral,
                            poolAmount: poolAmount,
                            reservedAmount: reservedAmount,
                            availableLiquidity: availableLiquidity,
                            fundingRate: fundingRate
                        }];
                case 15:
                    error_3 = _d.sent();
                    console.error('Error in getLeverageLiquidity:', error_3);
                    throw error_3;
                case 16: return [2 /*return*/];
            }
        });
    });
}
function checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, collateralToken, isLong) {
    return __awaiter(this, void 0, void 0, function () {
        var liquidity, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("Attempting to get liquidity for:\n      Vault: ".concat(vaultAddress, "\n      Index Token: ").concat(indexToken, "\n      Collateral: ").concat(collateralToken, "\n      Is Long: ").concat(isLong));
                    return [4 /*yield*/, getLeverageLiquidity({
                            provider: provider,
                            vaultAddress: vaultAddress,
                            indexToken: indexToken,
                            collateralToken: collateralToken,
                            isLong: isLong
                        })];
                case 1:
                    liquidity = _a.sent();
                    console.log('Got liquidity result:', JSON.stringify(liquidity, function (_, v) {
                        return typeof v === 'bigint' ? v.toString() : v;
                    }, 2));
                    return [2 /*return*/, {
                            maxLeverage: liquidity.maxLeverage,
                            maxPositionSize: ethers.utils.formatUnits(liquidity.maxPositionSize, 30),
                            maxCollateral: ethers.utils.formatUnits(liquidity.maxCollateral, 18),
                            poolAmount: ethers.utils.formatUnits(liquidity.poolAmount, 18),
                            reservedAmount: ethers.utils.formatUnits(liquidity.reservedAmount, 18),
                            fundingRate: liquidity.fundingRate.toString(),
                            availableLiquidity: ethers.utils.formatUnits(liquidity.availableLiquidity, 18)
                        }];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error in checkTokenLeverageLiquidity:', error_4);
                    if (error_4 instanceof Error) {
                        console.error('Error stack:', error_4.stack);
                    }
                    return [2 /*return*/, undefined];
                case 3: return [2 /*return*/];
            }
        });
    });
}
export function getAllTokenLeverageLiquidity(provider, vaultAddress, indexToken, usdcAddress, nativeTokenAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var results, _a, longSupportedTokens, _b;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log("Checking liquidity for index token: ".concat(indexToken));
                    console.log("USDC Address: ".concat(usdcAddress, ", Native Address: ").concat(nativeTokenAddress));
                    results = {};
                    if (!(indexToken !== usdcAddress)) return [3 /*break*/, 2];
                    console.log("Checking USDC collateral for ".concat(indexToken));
                    _a = results;
                    _c = {};
                    return [4 /*yield*/, checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, usdcAddress, false)];
                case 1:
                    _a.withUSDC = (_c.short = _e.sent(),
                        _c);
                    _e.label = 2;
                case 2:
                    longSupportedTokens = [
                        nativeTokenAddress.toLowerCase(), // S token
                        CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON.toLowerCase(),
                        CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH.toLowerCase()
                    ];
                    if (!(indexToken !== nativeTokenAddress && longSupportedTokens.includes(indexToken.toLowerCase()))) return [3 /*break*/, 4];
                    console.log("Checking native collateral for ".concat(indexToken));
                    _b = results;
                    _d = {};
                    return [4 /*yield*/, checkTokenLeverageLiquidity(provider, vaultAddress, indexToken, nativeTokenAddress, true)];
                case 3:
                    _b.withNativeToken = (_d.long = _e.sent(),
                        _d);
                    _e.label = 4;
                case 4:
                    console.log('Interim results:', JSON.stringify(results, null, 2));
                    return [2 /*return*/, results];
            }
        });
    });
}
