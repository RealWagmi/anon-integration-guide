import { ethers } from 'ethers';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants';
import { marketPosition } from './functions/trading/leverage/marketPosition';
import { getAllTokenLeverageLiquidity } from './functions/trading/leverage/getLiquidity';
import { Vault } from './abis/Vault';

async function test() {
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY is required in .env file');
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Use ANON as index token and native token as collateral
    const indexToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON;
    const collateralToken = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;

    console.log('Checking available liquidity...');
    const liquidity = await getAllTokenLeverageLiquidity(
        provider,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
        indexToken,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
    );

    console.log('Interim results:', JSON.stringify(liquidity, null, 2));

    // Get the available liquidity for long positions with native token collateral
    const availableLiquidity = liquidity.withNativeToken?.long?.availableLiquidity || '0';
    console.log('Available liquidity:', availableLiquidity);

    // Calculate position size as 10% of available liquidity
    const positionSize = (parseFloat(availableLiquidity) * 0.1).toString();
    const leverage = liquidity.withNativeToken?.long?.maxLeverage || 10;
    const collateralAmount = (parseFloat(positionSize) / leverage).toString();

    console.log('Opening long position with:');
    console.log('- Size:', positionSize);
    console.log('- Collateral:', collateralAmount);
    console.log('- Leverage:', leverage);

    // Create Vault contract instance
    const vault = new ethers.Contract(
        CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
        Vault,
        signer
    );

    // Approve PositionRouter plugin
    console.log('Approving PositionRouter plugin...');
    try {
        const tx = await vault.approvePlugin(CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER);
        await tx.wait();
        console.log('PositionRouter plugin approved');
    } catch (error: any) {
        console.log('Top level error:', error);
        if (error.error?.error?.data) {
            console.log('Error data:', error.error.error.data);
        }
        console.log('Error stack:', error.stack);
        return;
    }

    // Open the position
    try {
        const result = await marketPosition({
            signer,
            vaultAddress: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
            positionRouterAddress: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
            indexToken,
            collateralToken,
            isLong: true,
            sizeDelta: ethers.utils.parseEther(positionSize),
            collateralDelta: ethers.utils.parseEther(collateralAmount),
            isIncrease: true,
            executionFee: ethers.utils.parseEther('0.0001')
        });

        console.log('Position opened successfully:');
        console.log('- Position ID:', result.positionId);
        console.log('- Transaction Hash:', result.transactionHash);
    } catch (error: any) {
        console.log('Error opening position:', error);
        if (error.error?.error?.data) {
            console.log('Error data:', error.error.error.data);
        }
        console.log('Error stack:', error.stack);
    }
}

test().catch(console.error); 