import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

console.log('Environment PRIVATE_KEY:', process.env.PRIVATE_KEY);
console.log('Environment TEST_WALLET_PRIVATE_KEY:', process.env.TEST_WALLET_PRIVATE_KEY);

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
console.log('\nDerived Address Information:');
console.log('-------------------------');
console.log('Private Key:', privateKey);
console.log('Derived Address:', account.address); 