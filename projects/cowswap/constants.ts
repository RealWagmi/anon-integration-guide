import { ChainId } from '@heyanon/sdk';
import { Signer } from '@ethersproject/abstract-signer';
import { Bytes, hexlify } from '@ethersproject/bytes';
import type { Provider, TransactionRequest } from '@ethersproject/abstract-provider';
import type { Deferrable } from '@ethersproject/properties';
import type { Hex, Address, PublicClient, SignMessageReturnType } from 'viem';

export const supportedChains = [ChainId.ARBITRUM, ChainId.BASE, ChainId.GNOSIS, ChainId.ETHEREUM];

type SignMessageImpl = (messages: Hex[]) => Promise<SignMessageReturnType[]>;

export class HeyAnonSigner extends Signer {
    readonly client: PublicClient;
    readonly address: Address;
    private _signMessagesImpl: SignMessageImpl;

    constructor(address: Address, provider: PublicClient, signMessagesImpl: SignMessageImpl) {
        super();
        this.client = provider;
        this.address = address;
        this._signMessagesImpl = signMessagesImpl;
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    connect(_: Provider): HeyAnonSigner {
        throw new Error('Unimplemented function');
    }

    signTransaction(_: Deferrable<TransactionRequest>): Promise<string> {
        throw new Error('Unimplemented function');
    }

    async signMessage(message: string | Bytes): Promise<string> {
        const hexMessage = hexlify(message) as Hex;
        const [signedMessage] = await this._signMessagesImpl([hexMessage]);
        return signedMessage;
    }
}
