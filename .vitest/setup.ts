import { beforeAll } from 'vitest';

beforeAll(() => {
    // Mock window object since we're running in Node environment
    global.window = {
        ethereum: {
            request: async ({ method, params }: any) => {
                console.log('Mock ethereum request:', method, params);
                return '0x123...'; // Mock response
            }
        }
    } as any;
}); 