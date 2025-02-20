import { getTestHelpers } from '../helper';
import { afterEach, describe, test } from 'vitest';
import * as F from '../../functions';
import { Address, formatUnits, parseEther, toHex } from 'viem';
import { SONIC_TOKENS, veSWPxAddress } from '../../constants';
import { FORK_BLOCK_NUMBER } from '../config';
import { VotingEscrow } from '../../utils/VotingEscrow';
import { epochTimestampInSecToDate } from '../../utils';
import assert from 'node:assert';

const { reinit, account, options, transfer, client } = await getTestHelpers();

const TIMEOUT = 1000000;
const SWPxWhale = '0xc3660Ee9C357BF631af63621385Dcf9d5CF2F301';

describe('Voting', () => {
    // describe('Lock SWPx', () => {
    //     afterEach(async () => {
    //         await reinit();
    //     });
    //     test(
    //         'Success',
    //         async () => {
    //             const swpxLockAmount = '1000.420';
    //             const swpxLockTime = 2 * 365 * 86400;

    //             // fund account
    //             await transfer({
    //                 from: SWPxWhale,
    //                 to: account.address,
    //                 amount: parseEther(swpxLockAmount),
    //                 token: SONIC_TOKENS.SWPx.address,
    //             });

    //             // test
    //             const lockResult = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             assert.equal(lockResult.success, true);
    //             assert.equal(lockResult.data, 'Successfully Locked 1000.420 SWPx. Transaction submitted successfully');
    //         },
    //         TIMEOUT,
    //     );

    //     test(
    //         'Failed: 0 Lock Amount',
    //         async () => {
    //             const swpxLockAmount = '0';
    //             const swpxLockTime = 2 * 365 * 86400;

    //             // test
    //             const lockResult = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             assert.equal(lockResult.success, false);
    //             assert.equal(lockResult.data, 'ERROR: SWPx lock amount must be greater than 0');
    //         },
    //         TIMEOUT,
    //     );

    //     test(
    //         'Failed: 0 Lock Amount',
    //         async () => {
    //             const swpxLockAmount = '0';
    //             const swpxLockTime = 2 * 365 * 86400;

    //             // test
    //             const lockResult = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             assert.equal(lockResult.success, false);
    //             assert.equal(lockResult.data, 'ERROR: SWPx lock amount must be greater than 0');
    //         },
    //         TIMEOUT,
    //     );

    //     test(
    //         'Failed: Insufficient Lock Time',
    //         async () => {
    //             const swpxLockAmount = '1000.420';
    //             const swpxLockTime = 100;

    //             // test
    //             const lockResult = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             assert.equal(lockResult.success, false);
    //             assert.equal(lockResult.data, 'ERROR: SWPx lock time must be sufficient to reach next (Thursday 00:00 UTC)');
    //         },
    //         TIMEOUT,
    //     );

    //     test(
    //         'Failed: Exceeds Maximum Lock Time of 2 Years',
    //         async () => {
    //             const swpxLockAmount = '1000.420';
    //             const swpxLockTime = 2 * 365 * 86400 + 1;

    //             // test
    //             const lockResult = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             assert.equal(lockResult.success, false);
    //             assert.equal(lockResult.data, 'ERROR: Exceeds the maximum lock time of 2 years');
    //         },
    //         TIMEOUT,
    //     );

    //     test(
    //         'Failed: Insufficient SWPx amount',
    //         async () => {
    //             const swpxLockAmount = '1000.420';
    //             const swpxLockTime = 2 * 365 * 86400;

    //             // fund account
    //             const actualBalanceAmount = '420';
    //             await transfer({
    //                 from: SWPxWhale,
    //                 to: account.address,
    //                 amount: parseEther(actualBalanceAmount),
    //                 token: SONIC_TOKENS.SWPx.address,
    //             });

    //             // test
    //             const lockResult = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             assert.equal(lockResult.success, false);
    //             assert.equal(lockResult.data, `ERROR: Insufficient SWPx amount! Wants ${swpxLockAmount} SWPx but only Has ${actualBalanceAmount} SWPx.`);
    //         },
    //         TIMEOUT,
    //     );
    // });

    // describe('Get Locks List', () => {
    //     afterEach(async () => {
    //         await reinit();
    //     });
    //     test(
    //         'Found',
    //         async () => {
    //             const swpxLockAmount = '1000';
    //             const num = 3;
    //             const amount = num * Number(swpxLockAmount);
    //             const swpxLockTime = 2 * 365 * 86400;

    //             // fund account
    //             await transfer({
    //                 from: SWPxWhale,
    //                 to: account.address,
    //                 amount: parseEther(amount.toString()),
    //                 token: SONIC_TOKENS.SWPx.address,
    //             });

    //             // test
    //             const lock1 = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             const lock2 = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
    //             const lock3 = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);

    //             console.log('locks:', lock1, lock2, lock3);

    //             const result = await F.getLocks({ account: account.address }, options);
    //             const startId = 8310;

    //             assert.equal(result.success, true);

    //             const votingEscrow = new VotingEscrow(client);
    //             const tokens = await votingEscrow.getSwpxLocksTokenIds(account.address);

    //             let positions = 'SWPx locks list:\n\n';
    //             for (let t of tokens) {
    //                 positions += `   ID: ${t.lockId}\n`;
    //                 positions += `   Amount: ${formatUnits(BigInt(t.amount), 18)}\n`;
    //                 positions += `   Unlock Time: ${epochTimestampInSecToDate(t.unlockTime)}\n\n`;
    //             }

    //             assert.deepEqual(result.data, positions);
    //         },
    //         TIMEOUT,
    //     );
    //     test(
    //         'Not Found',
    //         async () => {
    //             const result = await F.getLocks({ account: account.address }, options);

    //             assert.equal(result.success, true);
    //             assert.equal(result.data, 'SWPx locks list:\n\n    No Locks Found');
    //         },
    //         TIMEOUT,
    //     );
    // });

    describe('Unlock SWPx', () => {
        afterEach(async () => {
            await reinit();
        });
        test(
            'Success',
            async () => {
                const swpxLockAmount = '1000.42';
                const swpxLockTime = 2 * 365 * 86400;

                // fund account
                await transfer({
                    from: SWPxWhale,
                    to: account.address,
                    amount: parseEther(swpxLockAmount),
                    token: SONIC_TOKENS.SWPx.address,
                });

                // test
                const lock = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
                assert.equal(lock.success, true);
                const ve = new VotingEscrow(client);

                const [token] = await ve.getSwpxLocksTokenIds(account.address);
                const { lockId } = token;

                const unlockResult = await F.unlockSWPx({ account: account.address, tokenId: lockId }, options);
                assert.equal(unlockResult.success, true);
                assert.equal(unlockResult.data, `Successfully unlocked #${lockId} with ${swpxLockAmount} SWPx. Transaction submitted successfully`);
            },
            TIMEOUT,
        );
        test(
            'Failed: Not Token ID owner',
            async () => {
                const lockId = 1n;
                const unlockResult = await F.unlockSWPx({ account: account.address, tokenId: lockId }, options);
                assert.equal(unlockResult.success, false);
                assert.equal(unlockResult.data, `ERROR: You are not the #${lockId} owner!`);
            },
            TIMEOUT,
        );
        test(
            'Failed: Token ID is attached',
            async () => {
                const swpxLockAmount = '1000.420';
                const swpxLockTime = 2 * 365 * 86400;

                // fund account
                await transfer({
                    from: SWPxWhale,
                    to: account.address,
                    amount: parseEther(swpxLockAmount),
                    token: SONIC_TOKENS.SWPx.address,
                });

                // test
                await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
                const ve = new VotingEscrow(client);

                const [token] = await ve.getSwpxLocksTokenIds(account.address);
                const { lockId } = token;

                const poolVotes: { pool: Address; weight: bigint }[] = [{ pool: '0xc4A71981DC8ee8ee704b6217DaebAd6ECe185aeb', weight: 100n }];
                await F.vote({ tokenId: lockId, account: account.address, poolVotes }, options);

                const unlockResult = await F.unlockSWPx({ account: account.address, tokenId: lockId }, options);
                assert.equal(unlockResult.success, false);
                assert.equal(unlockResult.data, `ERROR: Token ID #${lockId} is attached!`);
            },
            TIMEOUT,
        );
        test(
            'Failed: Cannot Unlock Vesting Token ID',
            async () => {
                const swpxLockAmount = '1000.420';
                const swpxLockTime = 2 * 365 * 86400;

                // fund account
                await transfer({
                    from: SWPxWhale,
                    to: account.address,
                    amount: parseEther(swpxLockAmount),
                    token: SONIC_TOKENS.SWPx.address,
                });

                // test
                const locked = await F.lockSWPx({ account: account.address, swpxLockAmount, swpxLockTime }, options);
                console.log('locked:', locked);
                const ve = new VotingEscrow(client);

                const [token] = await ve.getSwpxLocksTokenIds(account.address);
                const { lockId } = token;

                const unlockResult = await F.unlockSWPx({ account: account.address, tokenId: lockId }, options);
                assert.equal(unlockResult.success, false);
                assert.equal(unlockResult.data, `ERROR: Cannot unlock the token ID `);
            },
            TIMEOUT,
        );
    });

    // describe('Get Pending SWPx Locks Rewards', () => {
    //     test('Success', async () => {}, TIMEOUT);
    // });

    // describe('Claim Rewards', () => {
    //     test('Success', async () => {}, TIMEOUT);
    // });
});
