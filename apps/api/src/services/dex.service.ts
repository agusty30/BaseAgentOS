import { ethers } from 'ethers';
import { getSigner, getWalletById, getProvider } from './wallet.service.js';
import {
  NETWORKS,
  ERC20_ABI,
  UNISWAP_SWAP_ROUTER_ABI,
  UNISWAP_QUOTER_ABI,
  AERODROME_ROUTER_ABI,
  GAS_BUFFER_MULTIPLIER,
  DEFAULT_SLIPPAGE_BPS,
  type NetworkId,
  type SwapParams,
  type SwapQuote,
  type TransactionResult,
} from '@baseagent/shared';

// ─── DexProvider Interface ──────────────────────────────────────────

export interface DexProvider {
  name: string;
  getQuote(params: SwapParams, network: NetworkId): Promise<SwapQuote>;
  executeSwap(
    params: SwapParams,
    signer: ethers.Wallet,
    network: NetworkId,
  ): Promise<TransactionResult>;
}

// ─── Uniswap V3 Provider ───────────────────────────────────────────

const UNISWAP_QUOTER_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
const UNISWAP_DEFAULT_FEE = 3000; // 0.3%

export class UniswapProvider implements DexProvider {
  name = 'uniswap';

  async getQuote(params: SwapParams, network: NetworkId): Promise<SwapQuote> {
    const provider = getProvider(network);
    const networkConfig = NETWORKS[network];

    const quoter = new ethers.Contract(
      UNISWAP_QUOTER_ADDRESS,
      UNISWAP_QUOTER_ABI,
      provider,
    );

    const tokenInContract = new ethers.Contract(params.tokenIn, ERC20_ABI, provider);
    const tokenInDecimals = await tokenInContract.decimals();
    const amountInWei = ethers.parseUnits(params.amountIn, tokenInDecimals);

    try {
      const [amountOut, , , gasEstimate] = await quoter.quoteExactInputSingle.staticCall({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: amountInWei,
        fee: UNISWAP_DEFAULT_FEE,
        sqrtPriceLimitX96: 0n,
      });

      const tokenOutContract = new ethers.Contract(params.tokenOut, ERC20_ABI, provider);
      const tokenOutDecimals = await tokenOutContract.decimals();
      const amountOutFormatted = ethers.formatUnits(amountOut, tokenOutDecimals);

      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(
        params.amountIn,
        amountOutFormatted,
      );

      return {
        provider: this.name,
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        amountOut: amountOutFormatted,
        priceImpact,
        route: [params.tokenIn, params.tokenOut],
        gasEstimate: gasEstimate.toString(),
        validUntil: Math.floor(Date.now() / 1000) + 120, // 2 minutes
      };
    } catch (err) {
      throw new Error(`Uniswap quote failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async executeSwap(
    params: SwapParams,
    signer: ethers.Wallet,
    network: NetworkId,
  ): Promise<TransactionResult> {
    const networkConfig = NETWORKS[network];

    const router = new ethers.Contract(
      networkConfig.uniswapRouter,
      UNISWAP_SWAP_ROUTER_ABI,
      signer,
    );

    const tokenInContract = new ethers.Contract(params.tokenIn, ERC20_ABI, signer);
    const tokenInDecimals = await tokenInContract.decimals();
    const amountInWei = ethers.parseUnits(params.amountIn, tokenInDecimals);

    // Approve router to spend tokens
    const currentAllowance = await tokenInContract.allowance(
      await signer.getAddress(),
      networkConfig.uniswapRouter,
    );

    if (currentAllowance < amountInWei) {
      const approveTx = await tokenInContract.approve(
        networkConfig.uniswapRouter,
        amountInWei,
      );
      await approveTx.wait();
    }

    // Get quote for min amount out
    const quote = await this.getQuote(params, network);
    const tokenOutContract = new ethers.Contract(params.tokenOut, ERC20_ABI, signer);
    const tokenOutDecimals = await tokenOutContract.decimals();
    const amountOutWei = ethers.parseUnits(quote.amountOut, tokenOutDecimals);
    const slippageMultiplier = 10000n - BigInt(params.slippageBps || DEFAULT_SLIPPAGE_BPS);
    const amountOutMinimum = (amountOutWei * slippageMultiplier) / 10000n;

    const swapParams = {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      fee: UNISWAP_DEFAULT_FEE,
      recipient: params.recipient,
      amountIn: amountInWei,
      amountOutMinimum,
      sqrtPriceLimitX96: 0n,
    };

    try {
      const gasEstimate = await router.exactInputSingle.estimateGas(swapParams);
      const gasLimit = BigInt(Math.ceil(Number(gasEstimate) * GAS_BUFFER_MULTIPLIER));

      const tx = await router.exactInputSingle(swapParams, { gasLimit });
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not received');
      }

      return {
        txHash: receipt.hash,
        status: 'confirmed',
        gasUsed: receipt.gasUsed.toString(),
        gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
        blockNumber: receipt.blockNumber,
        explorerUrl: `${networkConfig.explorerUrl}/tx/${receipt.hash}`,
      };
    } catch (err) {
      throw new Error(`Uniswap swap failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private calculatePriceImpact(amountIn: string, amountOut: string): string {
    // Simplified price impact calculation
    // In production, compare against market price from an oracle
    const ratio = parseFloat(amountOut) / parseFloat(amountIn);
    const impact = Math.abs(1 - ratio) * 100;
    return impact.toFixed(4);
  }
}

// ─── Aerodrome Provider ─────────────────────────────────────────────

const AERODROME_DEFAULT_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';

export class AerodromeProvider implements DexProvider {
  name = 'aerodrome';

  async getQuote(params: SwapParams, network: NetworkId): Promise<SwapQuote> {
    const provider = getProvider(network);
    const networkConfig = NETWORKS[network];

    const router = new ethers.Contract(
      networkConfig.aerodromeRouter,
      AERODROME_ROUTER_ABI,
      provider,
    );

    const tokenInContract = new ethers.Contract(params.tokenIn, ERC20_ABI, provider);
    const tokenInDecimals = await tokenInContract.decimals();
    const amountInWei = ethers.parseUnits(params.amountIn, tokenInDecimals);

    const routes = [
      {
        from: params.tokenIn,
        to: params.tokenOut,
        stable: false,
        factory: AERODROME_DEFAULT_FACTORY,
      },
    ];

    try {
      const amounts = await router.getAmountsOut(amountInWei, routes);
      const amountOut = amounts[amounts.length - 1];

      const tokenOutContract = new ethers.Contract(params.tokenOut, ERC20_ABI, provider);
      const tokenOutDecimals = await tokenOutContract.decimals();
      const amountOutFormatted = ethers.formatUnits(amountOut, tokenOutDecimals);

      const priceImpact = this.calculatePriceImpact(
        params.amountIn,
        amountOutFormatted,
      );

      return {
        provider: this.name,
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        amountOut: amountOutFormatted,
        priceImpact,
        route: [params.tokenIn, params.tokenOut],
        gasEstimate: '200000', // Aerodrome typical estimate
        validUntil: Math.floor(Date.now() / 1000) + 120,
      };
    } catch (err) {
      throw new Error(`Aerodrome quote failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async executeSwap(
    params: SwapParams,
    signer: ethers.Wallet,
    network: NetworkId,
  ): Promise<TransactionResult> {
    const networkConfig = NETWORKS[network];

    const router = new ethers.Contract(
      networkConfig.aerodromeRouter,
      AERODROME_ROUTER_ABI,
      signer,
    );

    const tokenInContract = new ethers.Contract(params.tokenIn, ERC20_ABI, signer);
    const tokenInDecimals = await tokenInContract.decimals();
    const amountInWei = ethers.parseUnits(params.amountIn, tokenInDecimals);

    // Approve router
    const currentAllowance = await tokenInContract.allowance(
      await signer.getAddress(),
      networkConfig.aerodromeRouter,
    );

    if (currentAllowance < amountInWei) {
      const approveTx = await tokenInContract.approve(
        networkConfig.aerodromeRouter,
        amountInWei,
      );
      await approveTx.wait();
    }

    // Get quote for min amount out
    const quote = await this.getQuote(params, network);
    const tokenOutContract = new ethers.Contract(params.tokenOut, ERC20_ABI, signer);
    const tokenOutDecimals = await tokenOutContract.decimals();
    const amountOutWei = ethers.parseUnits(quote.amountOut, tokenOutDecimals);
    const slippageMultiplier = 10000n - BigInt(params.slippageBps || DEFAULT_SLIPPAGE_BPS);
    const amountOutMin = (amountOutWei * slippageMultiplier) / 10000n;

    const routes = [
      {
        from: params.tokenIn,
        to: params.tokenOut,
        stable: false,
        factory: AERODROME_DEFAULT_FACTORY,
      },
    ];

    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    try {
      const gasEstimate = await router.swapExactTokensForTokens.estimateGas(
        amountInWei,
        amountOutMin,
        routes,
        params.recipient,
        deadline,
      );
      const gasLimit = BigInt(Math.ceil(Number(gasEstimate) * GAS_BUFFER_MULTIPLIER));

      const tx = await router.swapExactTokensForTokens(
        amountInWei,
        amountOutMin,
        routes,
        params.recipient,
        deadline,
        { gasLimit },
      );

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not received');
      }

      return {
        txHash: receipt.hash,
        status: 'confirmed',
        gasUsed: receipt.gasUsed.toString(),
        gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
        blockNumber: receipt.blockNumber,
        explorerUrl: `${networkConfig.explorerUrl}/tx/${receipt.hash}`,
      };
    } catch (err) {
      throw new Error(`Aerodrome swap failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private calculatePriceImpact(amountIn: string, amountOut: string): string {
    const ratio = parseFloat(amountOut) / parseFloat(amountIn);
    const impact = Math.abs(1 - ratio) * 100;
    return impact.toFixed(4);
  }
}

// ─── Provider Registry ──────────────────────────────────────────────

const providers: Map<string, DexProvider> = new Map();

export function registerProvider(provider: DexProvider): void {
  providers.set(provider.name, provider);
}

export function getProviderByName(name: string): DexProvider {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`DEX provider '${name}' not found. Available: ${Array.from(providers.keys()).join(', ')}`);
  }
  return provider;
}

export function getAllProviders(): DexProvider[] {
  return Array.from(providers.values());
}

// Register default providers
registerProvider(new UniswapProvider());
registerProvider(new AerodromeProvider());

// ─── Aggregated Functions ───────────────────────────────────────────

export async function getBestQuote(
  params: SwapParams,
  network: NetworkId,
): Promise<SwapQuote> {
  const allProviders = getAllProviders();
  const quotePromises = allProviders.map(async (provider) => {
    try {
      return await provider.getQuote(params, network);
    } catch {
      return null;
    }
  });

  const quotes = (await Promise.all(quotePromises)).filter(
    (q): q is SwapQuote => q !== null,
  );

  if (quotes.length === 0) {
    throw new Error('No quotes available from any DEX provider');
  }

  // Return the quote with the highest output amount
  return quotes.reduce((best, current) =>
    parseFloat(current.amountOut) > parseFloat(best.amountOut) ? current : best,
  );
}

export async function executeSwapWithProvider(
  providerName: string,
  params: SwapParams,
  walletId: string,
  userId: string,
  network: NetworkId,
): Promise<TransactionResult> {
  const provider = getProviderByName(providerName);
  const wallet = await getWalletById(walletId, userId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const signer = getSigner(wallet);
  return provider.executeSwap(params, signer, network);
}

export const dexService = {
  getQuote: (providerName: string, params: SwapParams, network: NetworkId) => {
    const provider = getProviderByName(providerName);
    return provider.getQuote(params, network);
  },
  getBestQuote,
  executeSwap: executeSwapWithProvider,
  getProviderByName,
  getAllProviders,
};

