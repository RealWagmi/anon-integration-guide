import { Address } from 'viem';
import WebSocket from 'ws';

export async function _getUsersVaults(userAddress: Address): Promise<any> {
    return new Promise((resolve) => {
        const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

        const subscriptionMessage = {
            method: 'subscribe',
            subscription: {
                type: 'webData2',
                user: userAddress,
            },
        };

        ws.on('open', () => {
            ws.send(JSON.stringify(subscriptionMessage));
        });

        ws.on('message', (data: WebSocket.Data) => {
            try {
                const parsedData = JSON.parse(data.toString());
                if (parsedData?.data && parsedData?.channel == 'webData2') {
                    resolve(parsedData?.data?.leadingVaults || []);
                    ws.close();
                }
            } catch (err) {
                console.error('Error parsing message:', err);
                resolve(null);
                ws.close();
            }
        });

        ws.on('error', (err: Error) => {
            console.error('WebSocket error:', err);
            resolve(null);
        });

        ws.on('close', () => {
            // Optionally handle close
        });
    });
}
