import { createPublicClient, http, parseAbi } from 'viem'
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from './constants'

const VAULT_ABI = parseAbi([
  'function poolAmounts(address) view returns (uint256)',
  'function reservedAmounts(address) view returns (uint256)'
])

const client = createPublicClient({
  chain: {
    id: 146,
    name: 'sonic',
    network: 'sonic',
    nativeCurrency: {
      name: 'Sonic',
      symbol: 'S',
      decimals: 18
    },
    rpcUrls: {
      default: { http: [RPC_URLS[NETWORKS.SONIC]] }
    }
  },
  transport: http()
})

async function test() {
  console.log('Testing contract read...')
  
  // First verify we can connect to the contract
  const code = await client.getBytecode({
    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT
  })
  console.log('\nContract code exists:', Boolean(code))
  console.log('Contract code length:', code?.length ?? 0)

  // Try to read pool and reserved amounts for WETH
  const weth = CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH
  console.log('\nWETH address:', weth)

  try {
    console.log('\nTrying poolAmounts...')
    const pool = await client.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: VAULT_ABI,
      functionName: 'poolAmounts',
      args: [weth]
    })
    console.log('Pool amount:', pool)

    console.log('\nTrying reservedAmounts...')
    const reserved = await client.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: VAULT_ABI,
      functionName: 'reservedAmounts',
      args: [weth]
    })
    console.log('Reserved amount:', reserved)

  } catch (e) {
    console.error('Error reading contract:', e)
  }
}

test().catch(console.error) 