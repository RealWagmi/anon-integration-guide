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
import { Vault } from '../../../abis/Vault.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { Router } from '../../../abis/Router.js';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
function checkLiquidity(signer, indexToken, collateralToken, isLong, requiredSize) {
    return __awaiter(this, void 0, void 0, function () {
        var provider, vault, poolAmount, reservedAmount, availableLiquidity, requiredSize18;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = signer.provider;
                    vault = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT, Vault, provider);
                    return [4 /*yield*/, vault.poolAmounts(indexToken)];
                case 1:
                    poolAmount = _a.sent();
                    return [4 /*yield*/, vault.reservedAmounts(indexToken)];
                case 2:
                    reservedAmount = _a.sent();
                    availableLiquidity = poolAmount.sub(reservedAmount);
                    requiredSize18 = requiredSize.div(ethers.BigNumber.from(10).pow(12));
                    if (availableLiquidity.lt(requiredSize18)) {
                        throw new Error("Insufficient liquidity. Available: ".concat(ethers.utils.formatEther(availableLiquidity), " tokens, Required: ").concat(ethers.utils.formatEther(requiredSize18), " tokens"));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function approvePlugin(signer) {
    return __awaiter(this, void 0, void 0, function () {
        var router, account, positionRouterAddress, isApproved, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    router = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER, Router, signer);
                    return [4 /*yield*/, signer.getAddress()];
                case 1:
                    account = _a.sent();
                    positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
                    return [4 /*yield*/, router.approvedPlugins(account, positionRouterAddress)];
                case 2:
                    isApproved = _a.sent();
                    if (!!isApproved) return [3 /*break*/, 5];
                    console.log('Approving PositionRouter plugin...');
                    return [4 /*yield*/, router.approvePlugin(positionRouterAddress)];
                case 3:
                    tx = _a.sent();
                    return [4 /*yield*/, tx.wait()];
                case 4:
                    _a.sent();
                    console.log('PositionRouter plugin approved');
                    return [2 /*return*/, true];
                case 5: return [2 /*return*/, isApproved];
            }
        });
    });
}
function approveToken(signer, tokenAddress, spenderAddress, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var token, account, allowance, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = new ethers.Contract(tokenAddress, ERC20, signer);
                    return [4 /*yield*/, signer.getAddress()];
                case 1:
                    account = _a.sent();
                    return [4 /*yield*/, token.allowance(account, spenderAddress)];
                case 2:
                    allowance = _a.sent();
                    if (!allowance.lt(amount)) return [3 /*break*/, 5];
                    console.log('Approving token...');
                    return [4 /*yield*/, token.approve(spenderAddress, ethers.constants.MaxUint256)];
                case 3:
                    tx = _a.sent();
                    return [4 /*yield*/, tx.wait()];
                case 4:
                    _a.sent();
                    console.log('Token approved');
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function checkTokenLiquidity(provider, token, requiredAmount) {
    return __awaiter(this, void 0, void 0, function () {
        var vault, priceFeed, poolAmount, reservedAmount, availableLiquidity, tokenPrice, tokenPriceUsd, availableLiquidityTokens, availableLiquidityUsd;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    vault = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT, Vault, provider);
                    priceFeed = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED, VaultPriceFeed, provider);
                    return [4 /*yield*/, vault.poolAmounts(token)];
                case 1:
                    poolAmount = _a.sent();
                    return [4 /*yield*/, vault.reservedAmounts(token)];
                case 2:
                    reservedAmount = _a.sent();
                    availableLiquidity = poolAmount.sub(reservedAmount);
                    return [4 /*yield*/, priceFeed.getPrice(token, false, true, true)];
                case 3:
                    tokenPrice = _a.sent();
                    tokenPriceUsd = Number(ethers.utils.formatUnits(tokenPrice, 30));
                    availableLiquidityTokens = ethers.utils.formatUnits(availableLiquidity, 18);
                    availableLiquidityUsd = Number(availableLiquidityTokens) * tokenPriceUsd;
                    return [2 /*return*/, {
                            hasLiquidity: availableLiquidityUsd >= requiredAmount,
                            availableLiquidityTokens: availableLiquidityTokens,
                            availableLiquidityUsd: availableLiquidityUsd,
                            tokenPriceUsd: tokenPriceUsd
                        }];
            }
        });
    });
}
function findTokenWithLiquidity(provider, requiredAmount) {
    return __awaiter(this, void 0, void 0, function () {
        var tokens, _i, tokens_1, token, liquidity;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tokens = [
                        {
                            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
                            symbol: 'S'
                        },
                        {
                            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
                            symbol: 'ANON'
                        },
                        {
                            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
                            symbol: 'WETH'
                        }
                    ];
                    console.log('\nChecking available liquidity across tokens:');
                    _i = 0, tokens_1 = tokens;
                    _a.label = 1;
                case 1:
                    if (!(_i < tokens_1.length)) return [3 /*break*/, 4];
                    token = tokens_1[_i];
                    return [4 /*yield*/, checkTokenLiquidity(provider, token.address, requiredAmount)];
                case 2:
                    liquidity = _a.sent();
                    console.log("".concat(token.symbol, ":\n    Available Liquidity: ").concat(liquidity.availableLiquidityTokens, " ").concat(token.symbol, "\n    Liquidity Value: $").concat(liquidity.availableLiquidityUsd.toFixed(2), " USD\n    Price: $").concat(liquidity.tokenPriceUsd.toFixed(2), " USD"));
                    if (liquidity.hasLiquidity) {
                        return [2 /*return*/, {
                                token: token.address,
                                symbol: token.symbol,
                                liquidity: liquidity
                            }];
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, null];
            }
        });
    });
}
export function openMarketPosition(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var pluginApproved, positionRouterAddress, finalAcceptablePrice, provider, priceFeed, currentPrice, positionRouter, path, formattedReferralCode, tx, error_1;
        var signer = _b.signer, indexToken = _b.indexToken, collateralToken = _b.collateralToken, isLong = _b.isLong, sizeDelta = _b.sizeDelta, collateralAmount = _b.collateralAmount, leverage = _b.leverage, acceptablePrice = _b.acceptablePrice, _c = _b.minOut, minOut = _c === void 0 ? ethers.BigNumber.from(0) : _c, _d = _b.executionFee, executionFee = _d === void 0 ? ethers.utils.parseEther('0.001') : _d, _e = _b.referralCode, referralCode = _e === void 0 ? '' : _e, collateralDecimals = _b.collateralDecimals;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: 
                // 1. Check liquidity
                return [4 /*yield*/, checkLiquidity(signer, indexToken, collateralToken, isLong, sizeDelta)];
                case 1:
                    // 1. Check liquidity
                    _f.sent();
                    return [4 /*yield*/, approvePlugin(signer)];
                case 2:
                    pluginApproved = _f.sent();
                    if (!pluginApproved) {
                        throw new Error('PositionRouter plugin approval failed');
                    }
                    if (!(collateralToken !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN)) return [3 /*break*/, 4];
                    positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
                    return [4 /*yield*/, approveToken(signer, collateralToken, positionRouterAddress, collateralAmount)];
                case 3:
                    _f.sent();
                    _f.label = 4;
                case 4:
                    if (!acceptablePrice) return [3 /*break*/, 5];
                    finalAcceptablePrice = acceptablePrice;
                    return [3 /*break*/, 7];
                case 5:
                    provider = signer.provider;
                    priceFeed = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED, VaultPriceFeed, provider);
                    return [4 /*yield*/, priceFeed.getPrice(indexToken, false, true, true)];
                case 6:
                    currentPrice = _f.sent();
                    if (!currentPrice) {
                        throw new Error('Failed to get current price');
                    }
                    finalAcceptablePrice = isLong
                        ? currentPrice.mul(101).div(100) // 1% higher for longs
                        : currentPrice.mul(99).div(100); // 1% lower for shorts
                    _f.label = 7;
                case 7:
                    positionRouter = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER, PositionRouter, signer);
                    path = collateralToken === indexToken ? [collateralToken] : [collateralToken, indexToken];
                    formattedReferralCode = ethers.utils.formatBytes32String(referralCode);
                    console.log('Opening position with parameters:');
                    console.log('- Size Delta:', ethers.utils.formatUnits(sizeDelta, 30));
                    console.log('- Collateral:', ethers.utils.formatUnits(collateralAmount, collateralDecimals || 18));
                    console.log('- Leverage:', leverage);
                    console.log('- Acceptable Price:', ethers.utils.formatUnits(finalAcceptablePrice, 30));
                    console.log('- Execution Fee:', ethers.utils.formatEther(executionFee));
                    console.log('- Is Long:', isLong);
                    _f.label = 8;
                case 8:
                    _f.trys.push([8, 13, , 14]);
                    tx = void 0;
                    if (!(collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN)) return [3 /*break*/, 10];
                    return [4 /*yield*/, positionRouter.createIncreasePositionETH(path, // _path: single token if same, otherwise route from collateral to index
                        indexToken, // _indexToken
                        minOut, // _minOut (in token's native decimals)
                        sizeDelta, // _sizeDelta (in 30 decimals)
                        Boolean(isLong), // _isLong
                        finalAcceptablePrice, // _acceptablePrice (in 30 decimals for price feed)
                        executionFee, // _executionFee (in 18 decimals)
                        formattedReferralCode, // _referralCode
                        ethers.constants.AddressZero, // _callbackTarget
                        {
                            value: collateralAmount.add(executionFee), // For native token, send both collateral and fee
                            gasLimit: 600000
                        })];
                case 9:
                    // Use createIncreasePositionETH for native token
                    tx = _f.sent();
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, positionRouter.createIncreasePosition(path, // _path: single token if same, otherwise route from collateral to index
                    indexToken, // _indexToken
                    collateralAmount, // _amountIn (in token's native decimals)
                    minOut, // _minOut (in token's native decimals)
                    sizeDelta, // _sizeDelta (in 30 decimals)
                    Boolean(isLong), // _isLong
                    finalAcceptablePrice, // _acceptablePrice (in 30 decimals for price feed)
                    executionFee, // _executionFee (in 18 decimals)
                    formattedReferralCode, // _referralCode
                    ethers.constants.AddressZero, // _callbackTarget
                    {
                        value: executionFee, // For ERC20 tokens, only send fee
                        gasLimit: 600000
                    })];
                case 11:
                    // Use createIncreasePosition for ERC20 tokens
                    tx = _f.sent();
                    _f.label = 12;
                case 12:
                    console.log('Position open request submitted');
                    console.log('Transaction hash:', tx.hash);
                    return [2 /*return*/, tx];
                case 13:
                    error_1 = _f.sent();
                    console.error('Error opening position:', error_1);
                    throw error_1;
                case 14: return [2 /*return*/];
            }
        });
    });
}
export function openLongPosition(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var provider, priceFeed, indexPrice, indexPriceInUsd, sPrice, sPriceInUsd, sizeDelta, baseCollateralAmount, collateralAmount, balance, _c, _d;
        var signer = _b.signer, indexToken = _b.indexToken, usdAmount = _b.usdAmount, leverage = _b.leverage;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    provider = signer.provider;
                    priceFeed = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED, VaultPriceFeed, provider);
                    return [4 /*yield*/, priceFeed.getPrice(indexToken, false, true, true)];
                case 1:
                    indexPrice = _e.sent();
                    indexPriceInUsd = ethers.utils.formatUnits(indexPrice, 30);
                    console.log("Current Index Token Price: $".concat(indexPriceInUsd));
                    return [4 /*yield*/, priceFeed.getPrice(CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, false, true, true)];
                case 2:
                    sPrice = _e.sent();
                    sPriceInUsd = ethers.utils.formatUnits(sPrice, 30);
                    console.log("Current S Price: $".concat(sPriceInUsd));
                    sizeDelta = ethers.utils.parseUnits((usdAmount * leverage / Number(indexPriceInUsd)).toString(), 30);
                    baseCollateralAmount = ethers.utils.parseEther((usdAmount / Number(sPriceInUsd)).toString());
                    collateralAmount = baseCollateralAmount.mul(102).div(100);
                    _d = (_c = provider).getBalance;
                    return [4 /*yield*/, signer.getAddress()];
                case 3: return [4 /*yield*/, _d.apply(_c, [_e.sent()])];
                case 4:
                    balance = _e.sent();
                    if (balance.lt(collateralAmount.add(ethers.utils.parseEther('0.001')))) {
                        throw new Error("Insufficient balance for collateral: Required ".concat(ethers.utils.formatEther(collateralAmount.add(ethers.utils.parseEther('0.001'))), " S, Available ").concat(ethers.utils.formatEther(balance), " S"));
                    }
                    return [2 /*return*/, openMarketPosition({
                            signer: signer,
                            indexToken: indexToken,
                            collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
                            isLong: true,
                            sizeDelta: sizeDelta,
                            collateralAmount: collateralAmount,
                            leverage: leverage
                        })];
            }
        });
    });
}
function checkCollateralOptions(signer, requiredUsd) {
    return __awaiter(this, void 0, void 0, function () {
        var provider, userAddress, priceFeed, collateralTokens, nativeBalance, nativePrice, nativePriceUsd, nativeBalanceFormatted, nativeBalanceUsd, _i, collateralTokens_1, token, tokenContract, decimals, balance, price, priceUsd, balanceFormatted, balanceUsd, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = signer.provider;
                    return [4 /*yield*/, signer.getAddress()];
                case 1:
                    userAddress = _a.sent();
                    priceFeed = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED, VaultPriceFeed, provider);
                    collateralTokens = [
                        {
                            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
                            name: 'USDC.e'
                        },
                        {
                            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
                            name: 'WETH'
                        },
                        {
                            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
                            name: 'ANON'
                        }
                    ];
                    console.log('\nChecking available collateral options:');
                    return [4 /*yield*/, provider.getBalance(userAddress)];
                case 2:
                    nativeBalance = _a.sent();
                    return [4 /*yield*/, priceFeed.getPrice(CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, false, true, true)];
                case 3:
                    nativePrice = _a.sent();
                    nativePriceUsd = Number(ethers.utils.formatUnits(nativePrice, 30));
                    nativeBalanceFormatted = ethers.utils.formatEther(nativeBalance);
                    nativeBalanceUsd = Number(nativeBalanceFormatted) * nativePriceUsd;
                    console.log("S (native token):\n    Balance: ".concat(nativeBalanceFormatted, " S\n    Price: $").concat(nativePriceUsd.toFixed(2), "\n    Value: $").concat(nativeBalanceUsd.toFixed(2)));
                    if (nativeBalanceUsd >= requiredUsd) {
                        return [2 /*return*/, {
                                token: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
                                symbol: 'S',
                                balance: nativeBalance,
                                balanceFormatted: nativeBalanceFormatted,
                                balanceUsd: nativeBalanceUsd,
                                decimals: 18
                            }];
                    }
                    _i = 0, collateralTokens_1 = collateralTokens;
                    _a.label = 4;
                case 4:
                    if (!(_i < collateralTokens_1.length)) return [3 /*break*/, 11];
                    token = collateralTokens_1[_i];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 9, , 10]);
                    tokenContract = new ethers.Contract(token.address, ERC20, provider);
                    return [4 /*yield*/, tokenContract.decimals()];
                case 6:
                    decimals = _a.sent();
                    return [4 /*yield*/, tokenContract.balanceOf(userAddress)];
                case 7:
                    balance = _a.sent();
                    return [4 /*yield*/, priceFeed.getPrice(token.address, false, true, true)];
                case 8:
                    price = _a.sent();
                    priceUsd = Number(ethers.utils.formatUnits(price, 30));
                    balanceFormatted = ethers.utils.formatUnits(balance, decimals);
                    balanceUsd = Number(balanceFormatted) * priceUsd;
                    console.log("".concat(token.name, ":\n    Balance: ").concat(balanceFormatted, " ").concat(token.name, "\n    Price: $").concat(priceUsd.toFixed(2), "\n    Value: $").concat(balanceUsd.toFixed(2)));
                    if (balanceUsd >= requiredUsd) {
                        return [2 /*return*/, {
                                token: token.address,
                                symbol: token.name,
                                balance: balance,
                                balanceFormatted: balanceFormatted,
                                balanceUsd: balanceUsd,
                                decimals: decimals
                            }];
                    }
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    console.log("Error checking ".concat(token.name, ":"), error_2);
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 4];
                case 11: return [2 /*return*/, null];
            }
        });
    });
}
export function openLongPositionWithValue(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var leverage, provider, initialLiquidity, alternativeToken, bestCollateral, priceFeed, indexPrice, indexPriceInUsd, collateralPrice, collateralPriceInUsd, sizeDelta, collateralAmount, tokenContract, userAddress, allowance, approveTx;
        var signer = _b.signer, indexToken = _b.indexToken, collateralToken = _b.collateralToken, collateralValueUsd = _b.collateralValueUsd, positionValueUsd = _b.positionValueUsd;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Validate minimum collateral
                    if (collateralValueUsd < 10) {
                        throw new Error('Minimum collateral value is $10 USD');
                    }
                    // Validate minimum position size
                    if (positionValueUsd < 11) {
                        throw new Error('Minimum position value is $11 USD (1.1x leverage on $10 minimum collateral)');
                    }
                    leverage = positionValueUsd / collateralValueUsd;
                    if (leverage > 11) {
                        throw new Error('Maximum leverage is 11x');
                    }
                    if (leverage < 1.1) {
                        throw new Error('Minimum leverage is 1.1x');
                    }
                    provider = signer.provider;
                    // Check liquidity for requested token first
                    console.log("\nChecking liquidity for requested token...");
                    return [4 /*yield*/, checkTokenLiquidity(provider, indexToken, positionValueUsd)];
                case 1:
                    initialLiquidity = _c.sent();
                    if (!!initialLiquidity.hasLiquidity) return [3 /*break*/, 3];
                    console.log("\nInsufficient liquidity for requested token.\nAvailable: ".concat(initialLiquidity.availableLiquidityTokens, " tokens ($").concat(initialLiquidity.availableLiquidityUsd.toFixed(2), " USD)\nRequired: $").concat(positionValueUsd.toFixed(2), " USD"));
                    return [4 /*yield*/, findTokenWithLiquidity(provider, positionValueUsd)];
                case 2:
                    alternativeToken = _c.sent();
                    if (alternativeToken) {
                        throw new Error("Insufficient liquidity for requested token. " +
                            "Consider using ".concat(alternativeToken.symbol, " instead, which has $").concat(alternativeToken.liquidity.availableLiquidityUsd.toFixed(2), " available liquidity."));
                    }
                    else {
                        throw new Error("Insufficient liquidity for requested token and no alternative tokens found with sufficient liquidity. " +
                            "Required: $".concat(positionValueUsd.toFixed(2), " USD"));
                    }
                    _c.label = 3;
                case 3: return [4 /*yield*/, checkCollateralOptions(signer, collateralValueUsd)];
                case 4:
                    bestCollateral = _c.sent();
                    if (!bestCollateral) {
                        throw new Error("Insufficient balance in any supported collateral token. " +
                            "Required: $".concat(collateralValueUsd.toFixed(2), " USD"));
                    }
                    console.log("\nSelected collateral: ".concat(bestCollateral.symbol, "\n    Amount: ").concat(bestCollateral.balanceFormatted, " ").concat(bestCollateral.symbol, "\n    Value: $").concat(bestCollateral.balanceUsd.toFixed(2), " USD"));
                    // Use the best collateral token instead of the requested one
                    collateralToken = bestCollateral.token;
                    priceFeed = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED, VaultPriceFeed, provider);
                    return [4 /*yield*/, priceFeed.getPrice(indexToken, false, true, true)];
                case 5:
                    indexPrice = _c.sent();
                    indexPriceInUsd = ethers.utils.formatUnits(indexPrice, 30);
                    console.log("\nCurrent Index Token Price: $".concat(indexPriceInUsd));
                    return [4 /*yield*/, priceFeed.getPrice(collateralToken, false, true, true)];
                case 6:
                    collateralPrice = _c.sent();
                    collateralPriceInUsd = ethers.utils.formatUnits(collateralPrice, 30);
                    console.log("Current Collateral Token Price: $".concat(collateralPriceInUsd));
                    sizeDelta = ethers.utils.parseUnits((positionValueUsd / Number(indexPriceInUsd)).toString(), 30 // Use 30 decimals for sizeDelta as expected by the contract
                    );
                    collateralAmount = ethers.utils.parseUnits((collateralValueUsd / Number(collateralPriceInUsd)).toString(), bestCollateral.decimals // Use token's native decimals
                    );
                    if (!(collateralToken !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN)) return [3 /*break*/, 11];
                    tokenContract = new ethers.Contract(collateralToken, ERC20, provider);
                    return [4 /*yield*/, signer.getAddress()];
                case 7:
                    userAddress = _c.sent();
                    return [4 /*yield*/, tokenContract.allowance(userAddress, CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER)];
                case 8:
                    allowance = _c.sent();
                    if (!allowance.lt(collateralAmount)) return [3 /*break*/, 11];
                    console.log('Approving token spend...');
                    return [4 /*yield*/, tokenContract.connect(signer).approve(CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER, ethers.constants.MaxUint256 // Infinite approval
                        )];
                case 9:
                    approveTx = _c.sent();
                    return [4 /*yield*/, approveTx.wait()];
                case 10:
                    _c.sent();
                    console.log('Token spend approved');
                    _c.label = 11;
                case 11: 
                // Open the position
                return [2 /*return*/, openMarketPosition({
                        signer: signer,
                        indexToken: indexToken,
                        collateralToken: collateralToken,
                        isLong: true,
                        sizeDelta: sizeDelta,
                        collateralAmount: collateralAmount,
                        leverage: Math.round(leverage * 100) / 100, // Round to 2 decimal places
                        collateralDecimals: bestCollateral.decimals
                    })];
            }
        });
    });
}
