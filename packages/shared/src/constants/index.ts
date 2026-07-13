import type { NetworkConfig, NetworkId } from '../types/index.js';

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  'base-mainnet': {
    id: 'base-mainnet',
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: 'https://api.developer.coinbase.com/rpc/v1/base/4T9TMDeZoBgsTcdYmEo5oEG8hDFCS9qn',
    explorerUrl: 'https://basescan.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    weth: '0x4200000000000000000000000000000000000006',
    uniswapRouter: '0x2626664c2603336E57B271c5C0b26F421741e481',
    aerodromeRouter: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    aerodromeSlipstreamRouter: '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5',
  },
  'base-sepolia': {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/4T9TMDeZoBgsTcdYmEo5oEG8hDFCS9qn',
    explorerUrl: 'https://sepolia.basescan.org',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    weth: '0x4200000000000000000000000000000000000006',
    uniswapRouter: '0x2626664c2603336E57B271c5C0b26F421741e481',
    aerodromeRouter: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    aerodromeSlipstreamRouter: '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5',
  },
};

export const DEFAULT_NETWORK: NetworkId = 'base-sepolia';

export const USDC_DECIMALS = 6;
export const ETH_DECIMALS = 18;

export const MAX_SLIPPAGE_BPS = 500; // 5%
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

export const MAX_DAILY_VOLUME_USD = '100000';
export const MAX_TRADE_SIZE_USD = '10000';

export const GAS_BUFFER_MULTIPLIER = 1.2;

export const MISSION_STATUSES = [
  'planning',
  'queued',
  'running',
  'waiting_confirmation',
  'simulation',
  'executing',
  'completed',
  'failed',
  'retrying',
  'cancelled',
] as const;

export const AGENT_TYPES = [
  'payment',
  'treasury',
  'trading',
  'portfolio',
  'risk',
  'notification',
  'analytics',
  'execution',
] as const;

export function getExplorerTxUrl(network: NetworkId, txHash: string): string {
  return `${NETWORKS[network].explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(network: NetworkId, address: string): string {
  return `${NETWORKS[network].explorerUrl}/address/${address}`;
}
