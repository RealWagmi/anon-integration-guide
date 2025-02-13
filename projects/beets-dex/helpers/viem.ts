import { PublicWalletClient } from '@balancer/sdk';
import { FunctionOptions } from '@heyanon/sdk';
import { PublicClient, SignTypedDataParameters } from 'viem';

/**
 * Get a mock PublicWalletClient that can be used to sign typed data.
 */
export function getMockPublicWalletClient(publicClient: PublicClient, options: FunctionOptions): PublicWalletClient {
    return publicClient.extend((client) => ({
        signTypedData: async (typedData: SignTypedDataParameters) => {
            if (!options.signTypedDatas) {
                throw new Error('signTypedDatas not provided in options');
            }
            const signatures = await options.signTypedDatas([typedData]);
            return signatures[0];
        },
    })) as unknown as PublicWalletClient;
}
